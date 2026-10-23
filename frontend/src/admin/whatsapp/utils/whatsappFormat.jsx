import React from 'react';

// Mirrors backend/src/whatsapp/render.js so the preview shows exactly what the
// sender will fill in.
export const VARIABLES = [
  { key: 'name', label: 'Full name' },
  { key: 'firstName', label: 'First name' },
  { key: 'phone', label: 'Phone' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'membershipPlan', label: 'Membership plan' },
  { key: 'membershipExpiry', label: 'Membership expiry' },
  { key: 'membershipStatus', label: 'Membership status' },
  { key: 'lastService', label: 'Last service' },
  { key: 'lastVisit', label: 'Last visit' },
  { key: 'department', label: 'Department (staff)' },
  { key: 'businessName', label: 'Business name' },
  { key: 'invoiceNo', label: 'Invoice no. (invoices)' },
  { key: 'invoiceAmount', label: 'Invoice amount (invoices)' },
  { key: 'invoiceDate', label: 'Invoice date (invoices)' },
  { key: 'paymentMethod', label: 'Payment method (invoices)' },
  { key: 'services', label: 'Services billed (invoices)' }
];
const VARIABLE_KEYS = VARIABLES.map((v) => v.key);

const FALLBACKS = { name: 'Customer', firstName: 'there', businessName: 'The Shine Lounge' };

export const SAMPLE_VARS = {
  name: 'Rahul Sharma',
  firstName: 'Rahul',
  phone: '+91 98765 43210',
  vehicle: 'MH12AB1234 (Honda City)',
  membershipPlan: 'Monthly Unlimited Wash',
  membershipExpiry: '31 Oct 2026',
  membershipStatus: 'Active',
  lastService: 'Premium Foam Wash',
  lastVisit: '12 Oct 2026',
  department: 'Car Wash',
  businessName: 'The Shine Lounge',
  invoiceNo: 'TSL-1042',
  invoiceAmount: '1499',
  invoiceDate: '17 Oct 2026',
  paymentMethod: 'UPI',
  services: 'Premium Foam Wash'
};

// WhatsApp's own size limits per media type.
export const MEDIA_TYPES = {
  image: { label: 'Photo', accept: 'image/jpeg,image/png,image/webp', maxBytes: 5 * 1024 * 1024, hint: 'JPG or PNG, up to 5 MB' },
  video: { label: 'Video', accept: 'video/mp4,video/3gpp,video/quicktime,video/webm', maxBytes: 16 * 1024 * 1024, hint: 'MP4, up to 16 MB' },
  audio: { label: 'Audio', accept: 'audio/*', maxBytes: 16 * 1024 * 1024, hint: 'MP3, AAC, OGG or a voice recording, up to 16 MB' },
  document: { label: 'PDF', accept: 'application/pdf', maxBytes: 100 * 1024 * 1024, hint: 'PDF, up to 100 MB' }
};

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

const valueFor = (vars, key) => {
  const v = vars && vars[key];
  if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  return FALLBACKS[key] || '-';
};

export const renderVariables = (text, vars = {}) =>
  String(text || '').replace(PLACEHOLDER, (match, key) => (VARIABLE_KEYS.includes(key) ? valueFor(vars, key) : match));

// Templates imported from Meta use {{1}}, {{2}}; show them as the contact
// field each position is mapped to.
export const namedBody = (template) => {
  if (!template) return '';
  const map = template.variableMap || [];
  return String(template.body || '').replace(/\{\{\s*(\d+)\s*\}\}/g, (m, n) => {
    const key = map[Number(n) - 1];
    return key ? `{{${key}}}` : m;
  });
};

export const extractVariables = (text) => {
  const seen = [];
  String(text || '').replace(PLACEHOLDER, (m, key) => {
    if (VARIABLE_KEYS.includes(key) && !seen.includes(key)) seen.push(key);
    return m;
  });
  return seen;
};

// ── WhatsApp text formatting → React (no innerHTML) ─────────────────────────
const INLINE = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`|https?:\/\/[^\s]+)/g;

const renderInline = (text, keyPrefix) => {
  const parts = String(text).split(INLINE);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (/^\*[^*\n]+\*$/.test(part)) return <strong key={key}>{renderInline(part.slice(1, -1), key)}</strong>;
    if (/^_[^_\n]+_$/.test(part)) return <em key={key}>{renderInline(part.slice(1, -1), key)}</em>;
    if (/^~[^~\n]+~$/.test(part)) return <s key={key}>{renderInline(part.slice(1, -1), key)}</s>;
    if (/^`[^`\n]+`$/.test(part)) return <code key={key} className="px-1 rounded bg-black/5 font-mono text-[0.92em]">{part.slice(1, -1)}</code>;
    if (/^https?:\/\//.test(part)) {
      return <a key={key} href={part} target="_blank" rel="noreferrer" className="text-[#027eb5] underline break-all">{part}</a>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
};

export const formatWhatsAppText = (text) => {
  const blocks = String(text || '').split(/```/);
  return blocks.map((block, bi) => {
    if (bi % 2 === 1) {
      return <code key={`b${bi}`} className="block font-mono text-[0.92em] whitespace-pre-wrap">{block}</code>;
    }
    const lines = block.split('\n');
    return lines.map((line, li) => {
      const key = `b${bi}l${li}`;
      const isLast = li === lines.length - 1;
      if (/^>\s?/.test(line)) {
        return (
          <span key={key} className="block border-l-4 border-black/15 pl-2 my-0.5 text-black/70">
            {renderInline(line.replace(/^>\s?/, ''), key)}
          </span>
        );
      }
      return (
        <React.Fragment key={key}>
          {renderInline(line, key)}
          {!isLast && <br />}
        </React.Fragment>
      );
    });
  });
};

// ── Misc ─────────────────────────────────────────────────────────────────────
export const waMeLink = (phone, text) =>
  `https://wa.me/${String(phone || '').replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const normalizePhone = (raw) => {
  let d = String(raw || '').replace(/\D/g, '').replace(/^00/, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) return /^[6-9]/.test(d) ? `91${d}` : '';
  if (d.length === 12 && d.startsWith('91')) return /^[6-9]/.test(d.slice(2)) ? d : '';
  if (d.length >= 11 && d.length <= 15 && !d.startsWith('0')) return d;
  return '';
};

export const formatPhone = (p) => {
  const d = String(p || '');
  return d.length === 12 && d.startsWith('91') ? `+91 ${d.slice(2, 7)} ${d.slice(7)}` : (d ? `+${d}` : '');
};

export const within24h = (iso) => Boolean(iso) && Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;

export const timeAgo = (iso) => {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const formatBytes = (n) => {
  const b = Number(n) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export const TEMPLATE_STATUS_STYLES = {
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  PAUSED: 'bg-orange-50 text-orange-700 border-orange-200',
  DISABLED: 'bg-gray-200 text-gray-600 border-gray-300',
  IN_APPEAL: 'bg-sky-50 text-sky-700 border-sky-200'
};
