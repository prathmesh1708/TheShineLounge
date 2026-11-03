process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';
process.env.WHATSAPP_PROVIDER = 'bhashsms';
process.env.WHATSAPP_DRY_RUN = 'false';
process.env.BHASHSMS_VERSION = 'v2';
process.env.BHASHSMS_BASE_URL = 'https://apiv2.test';
process.env.BHASHSMS_API_KEY = 'v2-test-api-secret-key-1234567890';
process.env.BHASHSMS_BUSINESS_CODE = 'BSLB00494';
process.env.BHASHSMS_SENDER = 'BUZWAP';

const test = require('node:test');
const assert = require('node:assert/strict');
const bhash = require('../src/whatsapp/providers/bhashsms');

const realFetch = global.fetch;
let calls = [];

test.beforeEach(() => {
  calls = [];
  global.fetch = async (url, opts = {}) => {
    const u = String(url);
    const method = (opts.method || 'GET').toUpperCase();
    let body = null;
    try {
      body = opts.body ? JSON.parse(opts.body) : null;
    } catch (e) {
      body = opts.body;
    }
    calls.push({ url: u, method, headers: opts.headers, body });

    // Mock appAuthenticate
    if (u.includes('/auth/v1/appAuthenticate')) {
      const exp = Math.floor(Date.now() / 1000) + 600;
      const payload = Buffer.from(JSON.stringify({ userId: '764', exp })).toString('base64');
      const fakeToken = `header.${payload}.signature`;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          content: { accessToken: fakeToken, refreshToken: 'refresh-token-123', tokenType: 'Bearer' }
        })
      };
    }

    // Mock template list
    if (u.includes('/customer/api/v1/template/getAllApiTemplates')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          content: [
            {
              name: 'invoice_pdf',
              content: 'Hello {{1}}, your invoice {{2}} for Rs {{3}} is attached.',
              status: 'APPROVED',
              category: 'UTILITY',
              type: 'DOCUMENT',
              templateCode: 'TEMPLATE22001'
            },
            {
              name: 'promo_offer',
              content: 'Exciting offer for {{1}}!',
              status: 'APPROVED',
              category: 'MARKETING',
              type: 'IMAGE',
              templateCode: 'TEMPLATE22002'
            }
          ]
        })
      };
    }

    // Mock sendMessage
    if (u.includes('/customer/api/v1/campaign/sendMessage')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Message accepted successfully',
          content: { requestCode: `BSLB${Math.floor(Math.random() * 100000)}` }
        })
      };
    }

    // Mock sendReply
    if (u.includes('/messages/sendReply')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Message sent successfully',
          content: { requestCode: 'BSLBREPLY123' }
        })
      };
    }

    // Mock wallet balance
    if (u.includes('/customer/api/v1/wallet/apiWalletBalance')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          content: {
            businessId: 494,
            wallets: [
              { type: 'marketing', label: 'Marketing', walletBalance: 150 },
              { type: 'utilityAuthentication', label: 'Utility', walletBalance: 400 }
            ],
            totalCredits: 550
          }
        })
      };
    }

    return realFetch(url, opts);
  };
});

test.after(() => {
  global.fetch = realFetch;
});

test('BhashSMS V2 is configured and identified as V2', () => {
  assert.equal(bhash.isConfigured(), true);
  assert.equal(bhash.isV2(), true);
});

test('BhashSMS V2 authenticates and retrieves templates', async () => {
  const templates = await bhash.listTemplates();
  assert.equal(templates.length, 2);
  assert.equal(templates[0].name, 'invoice_pdf');
  assert.equal(templates[0].status, 'APPROVED');
  assert.equal(templates[0].headerType, 'document');
  assert.equal(templates[0].templateCode, 'TEMPLATE22001');

  // Verify auth header was used
  const authCall = calls.find((c) => c.url.includes('/auth/v1/appAuthenticate'));
  assert.ok(authCall, 'appAuthenticate was called');
  assert.equal(authCall.body.apiKey, 'v2-test-api-secret-key-1234567890');

  const listCall = calls.find((c) => c.url.includes('/customer/api/v1/template/getAllApiTemplates'));
  assert.ok(listCall, 'getAllApiTemplates was called');
  assert.ok(listCall.headers.Authorization.startsWith('Bearer '));
});

test('BhashSMS V2 sends template messages with header and variables', async () => {
  const res = await bhash.sendTemplate({
    phones: ['9876543210'],
    templateName: 'invoice_pdf',
    templateCode: 'TEMPLATE22001',
    params: ['Manik', 'INV-500', '1500'],
    media: { type: 'document', url: 'https://cloudinary.com/invoice.pdf' }
  });

  assert.ok(res.messageId.startsWith('BSLB'));
  const sendCall = calls.find((c) => c.url.includes('/customer/api/v1/campaign/sendMessage'));
  assert.ok(sendCall);
  assert.equal(sendCall.body.businessCode, 'BSLB00494');
  assert.equal(sendCall.body.templateCode, 'TEMPLATE22001');
  assert.equal(sendCall.body.mobileNumbers, '919876543210');
  assert.deepEqual(sendCall.body.header, { type: 'DOCUMENT', value: 'https://cloudinary.com/invoice.pdf' });
  assert.deepEqual(sendCall.body.values, [
    { variable: '1', value: 'Manik' },
    { variable: '2', value: 'INV-500' },
    { variable: '3', value: '1500' }
  ]);
});

test('BhashSMS V2 sends free-form messages via sendReply', async () => {
  const res = await bhash.sendText({
    phones: ['9876543210'],
    text: 'Hello, your car is ready!'
  });

  assert.equal(res.messageId, 'BSLBREPLY123');
  const textCall = calls.find((c) => c.url.includes('/messages/sendReply'));
  assert.ok(textCall);
  assert.equal(textCall.body.to, '919876543210');
  assert.equal(textCall.body.text, 'Hello, your car is ready!');
});

test('BhashSMS V2 fetches wallet balance with formatted labels', async () => {
  const balance = await bhash.getBalance();
  assert.equal(balance, 'Marketing: 150 credits | Utility: 400 credits');
});

