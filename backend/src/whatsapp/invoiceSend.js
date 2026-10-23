const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const OfflineSale = require('../models/OfflineSale');
const Booking = require('../models/Booking');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const provider = require('./provider');
const { normalizePhone, formatPhone } = require('./phone');
const { runWhatsAppSenderTick } = require('./sender');

// Staff billing and admin offline sales send the receipt PDF straight to the customer through the
// approved "invoice" template (marked in WhatsApp Hub -> Templates). The send
// is recorded as a one-recipient campaign so it shows in the hub's history.
// Mounted at /api/whatsapp/invoice ahead of the admin-only hub router.

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const TZ = process.env.SITE_TIMEZONE || 'Asia/Kolkata';

router.use(authMiddleware, staffOnly);

const invoiceTemplate = () => WhatsAppTemplate.findOne({ purpose: 'invoice' }).lean();

// Why API sending is unavailable, or '' when it is ready.
const unavailableReason = (template) => {
  if (!provider.isConfigured()) return 'WhatsApp API is not configured';
  if (!template) return 'No invoice template is set — an admin marks one in WhatsApp Hub → Templates';
  if (template.metaStatus !== 'APPROVED' && !provider.isDryRun()) return `Invoice template "${template.name}" is not approved yet`;
  return '';
};

// Amounts go into a comma-separated parameter list, so no thousands separators.
const plainAmount = (n) => {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

const invoiceVars = (invoice, phone) => {
  const name = String(invoice.customerName || '').trim();
  return {
    name,
    firstName: name.split(/\s+/)[0] || '',
    phone: formatPhone(phone),
    vehicle: invoice.vehicleNo || '',
    department: invoice.department || '',
    invoiceNo: invoice.invoiceNo,
    invoiceAmount: plainAmount(invoice.total),
    invoiceDate: new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ }),
    paymentMethod: invoice.paymentMethod || '',
    services: (invoice.items || []).map((i) => i.name).filter(Boolean).join(' + '),
    businessName: 'The Shine Lounge'
  };
};

router.get('/config', wrap(async (req, res) => {
  const template = await invoiceTemplate();
  const reason = unavailableReason(template);
  res.json({
    success: true,
    enabled: !reason,
    reason,
    provider: provider.providerName(),
    dryRun: provider.isDryRun(),
    template: template ? {
      name: template.name,
      displayName: template.displayName,
      body: template.body,
      headerType: template.headerType,
      variableMap: template.variableMap
    } : null
  });
}));

// Builds the one-recipient campaign for a receipt, sends it immediately and
// returns the recipient's outcome. Shared by staff invoices and offline sales.
const deliverReceipt = async ({ req, template, phone, pdfUrl, receiptNo, customerName, vars }) => {
  // A document header carries the PDF; image/video headers keep the template's own file.
  let media = { type: 'none', url: '', filename: '' };
  if (template.headerType === 'document') {
    if (!/^https:\/\//i.test(String(pdfUrl || ''))) {
      const err = new Error('The receipt PDF must be uploaded first (public https link)');
      err.status = 400;
      throw err;
    }
    const unreachable = await provider.checkPublicDocument(pdfUrl);
    if (unreachable) {
      const err = new Error(unreachable);
      err.status = 424;
      throw err;
    }
    media = { type: 'document', url: pdfUrl, filename: `Invoice-${receiptNo}.pdf` };
  } else if (['image', 'video'].includes(template.headerType)) {
    media = { type: template.headerType, url: template.headerMediaUrl, filename: '' };
  }

  const campaign = await WhatsAppCampaign.create({
    title: `Receipt ${receiptNo}`,
    source: 'invoice',
    invoiceNo: receiptNo,
    provider: provider.providerName(),
    mode: 'template',
    templateId: template._id,
    templateName: template.name,
    templateCategory: template.category,
    templateLanguage: template.language,
    variableMap: template.variableMap || [],
    body: template.body,
    media,
    recipients: [{ phone, name: customerName || '', kind: 'customer', vars }],
    scheduledAt: new Date(),
    dryRun: provider.isDryRun(),
    createdBy: (req.user && (req.user.email || req.user.fullName)) || ''
  });

  // One recipient: send now and answer with the real outcome.
  await runWhatsAppSenderTick(new Date(), { campaignId: campaign._id });
  const done = await WhatsAppCampaign.findById(campaign._id).lean();
  const r = (done && done.recipients[0]) || {};
  return { recipient: r, campaignId: campaign._id, sent: ['sent', 'delivered', 'read'].includes(r.status) };
};

const respond = (res, { recipient: r, campaignId, sent }, phone) => {
  if (!sent && r.status !== 'queued') {
    return res.status(502).json({ success: false, status: r.status, message: r.error || 'WhatsApp send failed', campaignId });
  }
  return res.json({ success: true, status: r.status, phone: formatPhone(phone), dryRun: provider.isDryRun(), campaignId });
};

// Staff billing invoices (Invoice collection).
router.post('/:invoiceNo/send', wrap(async (req, res) => {
  const template = await invoiceTemplate();
  const reason = unavailableReason(template);
  if (reason) return res.status(400).json({ success: false, code: 'UNAVAILABLE', message: reason });

  const invoice = await Invoice.findOne({ invoiceNo: req.params.invoiceNo, isDeleted: { $ne: true } });
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  const phone = normalizePhone((req.body && req.body.phone) || invoice.phone);
  if (!phone) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' });

  const pdfUrl = String((req.body && req.body.pdfUrl) || invoice.receiptPdfUrl || '').trim();
  let outcome;
  try {
    outcome = await deliverReceipt({
      req, template, phone, pdfUrl,
      receiptNo: invoice.invoiceNo,
      customerName: invoice.customerName,
      vars: invoiceVars(invoice, phone)
    });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }

  if (template.headerType === 'document') invoice.receiptPdfUrl = pdfUrl;
  invoice.whatsappStatus = outcome.recipient.status || 'queued';
  invoice.whatsappError = outcome.sent ? '' : (outcome.recipient.error || '');
  if (outcome.sent) invoice.whatsappSentAt = new Date();
  await invoice.save();
  return respond(res, outcome, phone);
}));

// Admin offline sales / POS receipts. A sale lives in offline_sales (saleId)
// and is mirrored into bookings (bookingId); older rows exist only as
// bookings, so every id the screen knows is tried.
const findSale = async (ids) => {
  for (const id of ids) {
    const sale = await OfflineSale.findOne({ saleId: id, isDeleted: { $ne: true } }).lean();
    if (sale) return sale;
  }
  for (const id of ids) {
    const or = [{ bookingId: id }];
    if (mongoose.isValidObjectId(id)) or.push({ _id: id });
    const booking = await Booking.findOne({ $or: or }).lean();
    if (booking) return booking;
  }
  return null;
};

const saleVars = (sale, phone, receiptNo) => {
  const name = String(sale.customerName || '').trim();
  const plates = (sale.vehicles || []).map((v) => v && v.plateNumber).filter(Boolean);
  return {
    name,
    firstName: name.split(/\s+/)[0] || '',
    phone: formatPhone(phone),
    vehicle: plates.length ? plates.join(' / ') : (sale.vehicleNo || ''),
    department: sale.serviceName || '',
    invoiceNo: receiptNo,
    invoiceAmount: plainAmount(sale.price),
    invoiceDate: new Date(sale.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ }),
    paymentMethod: sale.paymentMode || '',
    services: sale.packageName || sale.membershipName || sale.serviceName || '',
    businessName: 'The Shine Lounge'
  };
};

router.post('/sale/:receiptNo/send', wrap(async (req, res) => {
  const template = await invoiceTemplate();
  const reason = unavailableReason(template);
  if (reason) return res.status(400).json({ success: false, code: 'UNAVAILABLE', message: reason });

  const receiptNo = String(req.params.receiptNo || '').trim();
  const extraIds = Array.isArray(req.body && req.body.lookupIds) ? req.body.lookupIds : [];
  const ids = [...new Set([receiptNo, ...extraIds].map((v) => String(v || '').trim()).filter(Boolean))].slice(0, 5);
  const sale = await findSale(ids);
  if (!sale) return res.status(404).json({ success: false, message: `Sale ${receiptNo} not found` });

  const phone = normalizePhone((req.body && req.body.phone) || sale.phone);
  if (!phone) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' });

  try {
    const outcome = await deliverReceipt({
      req, template, phone,
      pdfUrl: String((req.body && req.body.pdfUrl) || '').trim(),
      receiptNo,
      customerName: sale.customerName,
      vars: saleVars(sale, phone, receiptNo)
    });
    return respond(res, outcome, phone);
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}));

module.exports = router;
module.exports.invoiceVars = invoiceVars;
module.exports.saleVars = saleVars;
