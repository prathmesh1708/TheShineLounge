// Message variables: the admin writes {{name}}, {{vehicle}} ... and each
// recipient's own values are filled in. The frontend has a copy of this list
// (admin/whatsapp/utils/whatsappFormat.js) for the live preview.

const VARIABLES = [
  'name',
  'firstName',
  'phone',
  'vehicle',
  'membershipPlan',
  'membershipExpiry',
  'membershipStatus',
  'lastService',
  'lastVisit',
  'department',
  'businessName',
  // Filled only when sending an invoice receipt.
  'invoiceNo',
  'invoiceAmount',
  'invoiceDate',
  'paymentMethod',
  'services'
];

// Meta rejects an empty template parameter, so every variable has a fallback.
const FALLBACKS = {
  name: 'Customer',
  firstName: 'there',
  businessName: 'The Shine Lounge'
};

const PLACEHOLDER = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

const valueFor = (vars, key) => {
  const v = vars && vars[key];
  if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  return FALLBACKS[key] || '-';
};

const renderText = (text, vars = {}) =>
  String(text || '').replace(PLACEHOLDER, (match, key) =>
    (VARIABLES.includes(key) ? valueFor(vars, key) : match));

// Named variables in order of first appearance: "Hi {{name}}, {{vehicle}} ... {{name}}"
// -> ['name', 'vehicle'].
const extractVariables = (text) => {
  const seen = [];
  String(text || '').replace(PLACEHOLDER, (m, key) => {
    if (VARIABLES.includes(key) && !seen.includes(key)) seen.push(key);
    return m;
  });
  return seen;
};

// Rewrite named placeholders to Meta's positional form, using `variableMap`
// as the position order: {{name}} -> {{1}}.
const toPositional = (text, variableMap) =>
  String(text || '').replace(PLACEHOLDER, (match, key) => {
    const idx = variableMap.indexOf(key);
    return idx === -1 ? match : `{{${idx + 1}}}`;
  });

const SAMPLE_VARS = {
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

module.exports = { VARIABLES, FALLBACKS, SAMPLE_VARS, renderText, extractVariables, toPositional, valueFor };
