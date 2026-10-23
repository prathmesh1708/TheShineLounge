import apiClient from '../utils/apiClient';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { getReceiptPdfBlob } from '../utils/receiptPdfGenerator';

// Sending a receipt PDF through the business WhatsApp API (BhashSMS / Meta).
// The backend owns the approved template and the bill values; the browser
// only supplies the rendered PDF, uploaded to Cloudinary so WhatsApp can fetch
// it. A wa.me link can never carry a file — only this path attaches the PDF.

const CONFIG_TTL_MS = 60 * 1000;
let configCache = { at: 0, promise: null };

export const getInvoiceWhatsAppConfig = ({ force = false } = {}) => {
  if (!force && configCache.promise && Date.now() - configCache.at < CONFIG_TTL_MS) return configCache.promise;
  const promise = apiClient.get('/whatsapp/invoice/config')
    .then((res) => res.data)
    .catch(() => ({ enabled: false, reason: 'Could not reach the WhatsApp service', template: null }));
  configCache = { at: Date.now(), promise };
  return promise;
};

// "919876543210" for a valid Indian mobile, else ''.
export const whatsappNumber = (raw) => {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) return `91${d}`;
  if (d.length === 12 && d.startsWith('91') && /^[6-9]/.test(d.slice(2))) return d;
  return '';
};

const plainAmount = (n) => {
  const v = Math.round((Number(String(n === undefined || n === null ? 0 : n).replace(/[^0-9.]/g, '')) || 0) * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const invoiceTemplateValues = (invoice) => {
  const name = String(invoice.customerName || '').trim();
  return {
    name: name || 'Customer',
    firstName: name.split(/\s+/)[0] || 'there',
    phone: invoice.phone || '',
    vehicle: invoice.vehicleNo || '-',
    department: invoice.department || '-',
    invoiceNo: invoice.id || invoice.invoiceNo || '',
    invoiceAmount: plainAmount(invoice.total),
    invoiceDate: today(),
    paymentMethod: invoice.paymentMethod || '-',
    services: (invoice.items || []).map((i) => i.name).filter(Boolean).join(' + ') || '-',
    businessName: 'The Shine Lounge'
  };
};

export const saleTemplateValues = (sale, receiptNo) => {
  const name = String(sale.customerName || sale.customer || '').trim();
  const plates = (Array.isArray(sale.vehicles) ? sale.vehicles : []).map((v) => v && v.plateNumber).filter(Boolean);
  return {
    name: name || 'Customer',
    firstName: name.split(/\s+/)[0] || 'there',
    phone: sale.phone || '',
    vehicle: plates.length ? plates.join(' / ') : (sale.vehicleNo || '-'),
    department: sale.serviceName || '-',
    invoiceNo: receiptNo,
    invoiceAmount: plainAmount(sale.price || sale.total || sale.amount),
    invoiceDate: today(),
    paymentMethod: sale.paymentMode || '-',
    services: sale.packageName || sale.membershipName || sale.serviceName || '-',
    businessName: 'The Shine Lounge'
  };
};

// What the customer will read — the approved template filled with these values.
export const renderReceiptTemplate = (template, values) => {
  if (!template) return '';
  const map = template.variableMap || [];
  return String(template.body || '')
    .replace(/\{\{\s*(\d+)\s*\}\}/g, (m, n) => (map[Number(n) - 1] ? values[map[Number(n) - 1]] || '-' : m))
    .replace(/\{\{\s*([a-zA-Z]\w*)\s*\}\}/g, (m, key) => (key in values ? values[key] : m));
};

export const renderInvoiceTemplate = (template, invoice) => renderReceiptTemplate(template, invoiceTemplateValues(invoice));

const uploadReceiptPdf = async (receiptElement, receiptNo) => {
  const filename = `Invoice-${receiptNo}.pdf`;
  const blob = await getReceiptPdfBlob(receiptElement, filename);
  const file = new File([blob], filename, { type: 'application/pdf', lastModified: Date.now() });
  const uploaded = await uploadToCloudinary(file, 'shine-lounge/invoices');
  if (!/^https:\/\//.test(uploaded.url || '')) {
    throw new Error('The PDF could not be stored online (Cloudinary is not configured on the server)');
  }
  return uploaded.url;
};

const postSend = async (path, body) => {
  try {
    const res = await apiClient.post(path, body);
    return res.data;
  } catch (err) {
    throw new Error((err.response && err.response.data && err.response.data.message) || err.message || 'WhatsApp send failed');
  }
};

/**
 * kind 'invoice' = staff billing invoice (invoiceNo); kind 'sale' = admin
 * offline sale / POS receipt (receiptNo + any other ids the row is known by).
 * Renders the receipt element to PDF when the template carries a document.
 */
export const sendReceiptOnWhatsApp = async ({ kind, receiptNo, lookupIds = [], phone, receiptElement, template }) => {
  const pdfUrl = template && template.headerType === 'document' ? await uploadReceiptPdf(receiptElement, receiptNo) : '';
  const path = kind === 'sale'
    ? `/whatsapp/invoice/sale/${encodeURIComponent(receiptNo)}/send`
    : `/whatsapp/invoice/${encodeURIComponent(receiptNo)}/send`;
  return postSend(path, { phone, pdfUrl, lookupIds });
};

export const sendInvoiceOnWhatsApp = ({ invoiceNo, phone, receiptElement, template }) =>
  sendReceiptOnWhatsApp({ kind: 'invoice', receiptNo: invoiceNo, phone, receiptElement, template });
