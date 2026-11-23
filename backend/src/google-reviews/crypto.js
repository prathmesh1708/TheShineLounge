const crypto = require('crypto');
const { GOOGLE_TOKEN_ENC_KEY, JWT_SECRET } = require('../common/config/env');

// AES-256-GCM for the stored Google refresh token. The key is derived from
// GOOGLE_TOKEN_ENC_KEY (or JWT_SECRET when unset) so any string length works.
// Format: v1.<iv>.<tag>.<ciphertext>, each part base64url.

const key = () => crypto
  .createHash('sha256')
  .update(`google-token:${GOOGLE_TOKEN_ENC_KEY || JWT_SECRET}`)
  .digest();

const encrypt = (plain) => {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv, tag, data].map((p) => (typeof p === 'string' ? p : p.toString('base64url'))).join('.');
};

const decrypt = (packed) => {
  if (!packed) return '';
  const [version, iv, tag, data] = String(packed).split('.');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('Stored Google token is malformed');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
};

module.exports = { encrypt, decrypt };
