const Customer = require('../models/Customer');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Booking = require('../models/Booking');
const OfflineSale = require('../models/OfflineSale');
const MembershipPass = require('../models/MembershipPass');
const RegisteredVehicle = require('../models/RegisteredVehicle');
const Invoice = require('../models/Invoice');
const WhatsAppContactPref = require('../models/WhatsAppContactPref');
const { SITE_TIMEZONE } = process.env;
const { normalizePhone, formatPhone } = require('./phone');

// The WhatsApp audience is every phone number the business holds, wherever it
// was typed: CRM customers, app accounts, staff, bookings, counter sales,
// membership passes and vehicle owners. They are merged on the normalized
// number, so one person seen in five places is one contact.

const CACHE_MS = 60 * 1000;
let cache = { at: 0, contacts: null, pending: null };

const NOT_DELETED = { isDeleted: { $ne: true } };

// Higher wins when two sources disagree on the name.
const NAME_PRIORITY = { crm: 6, staff: 6, app: 5, membership: 4, booking: 3, sale: 3, invoice: 3, vehicle: 2, whatsapp: 1 };

const TZ = SITE_TIMEZONE || 'Asia/Kolkata';
const formatDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  if (!d || isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ });
};

const cleanName = (name) => {
  const n = String(name || '').trim();
  return /^(customer|walk-?in|guest|n\/?a|-)$/i.test(n) ? '' : n;
};

const createContact = (phone) => ({
  phone,
  display: formatPhone(phone),
  name: '',
  namePriority: 0,
  kinds: new Set(),
  sources: new Set(),
  vehicles: new Set(),
  serviceKeys: new Set(),
  email: '',
  customerId: '',
  department: '',
  staffRole: '',
  staffActive: null,
  totalSpent: 0,
  visits: 0,
  lastVisitAt: null,
  lastService: '',
  membership: null
});

const collectSources = async () => {
  const [customers, users, staff, bookings, sales, passes, vehicles, invoices, prefs] = await Promise.all([
    Customer.find(NOT_DELETED).select('customerId fullName mobile email totalSpent').lean(),
    User.find({ ...NOT_DELETED, role: 'user' }).select('fullName mobile email vehicles membership').lean(),
    Staff.find(NOT_DELETED).select('fullName mobile email department staffRole isActive').lean(),
    Booking.find({ ...NOT_DELETED, phone: { $nin: ['', null] } })
      .select('customerName customerEmail phone serviceKey serviceName packageName vehicleNo price createdAt').lean(),
    OfflineSale.find({ ...NOT_DELETED, phone: { $nin: ['', null] } })
      .select('customerName customerEmail phone serviceKey serviceName packageName vehicleNo price createdAt').lean(),
    MembershipPass.find({ ...NOT_DELETED, phone: { $nin: ['', null] } })
      .select('customerName customerEmail phone planName serviceKey expiryDate status boundVehicles').lean(),
    RegisteredVehicle.find({ ...NOT_DELETED, ownerPhone: { $nin: ['', null] } })
      .select('ownerName ownerEmail ownerPhone plateNumber brand model').lean(),
    Invoice.find({ ...NOT_DELETED, phone: { $nin: ['', null] } })
      .select('customerName customerEmail phone departmentKey items vehicleNo total createdAt').lean(),
    WhatsAppContactPref.find({}).lean()
  ]);
  return { customers, users, staff, bookings, sales, passes, vehicles, invoices, prefs };
};

const buildContacts = async () => {
  const src = await collectSources();
  const map = new Map();

  const touch = (rawPhone, source, kind, name, email) => {
    const phone = normalizePhone(rawPhone);
    if (!phone) return null;
    let c = map.get(phone);
    if (!c) {
      c = createContact(phone);
      map.set(phone, c);
    }
    c.sources.add(source);
    c.kinds.add(kind);
    const n = cleanName(name);
    if (n && NAME_PRIORITY[source] > c.namePriority) {
      c.name = n;
      c.namePriority = NAME_PRIORITY[source];
    }
    if (email && !c.email) c.email = String(email).toLowerCase().trim();
    return c;
  };

  const addVisit = (c, row) => {
    c.visits += 1;
    if (row.serviceKey) c.serviceKeys.add(row.serviceKey);
    if (row.vehicleNo) c.vehicles.add(String(row.vehicleNo).toUpperCase().trim());
    const at = row.createdAt ? new Date(row.createdAt) : null;
    if (at && (!c.lastVisitAt || at > c.lastVisitAt)) {
      c.lastVisitAt = at;
      c.lastService = row.packageName || row.serviceName || c.lastService;
    }
  };

  const addMembership = (c, m) => {
    if (!m || !m.planName || !m.expiryDate) return;
    const expiry = new Date(m.expiryDate);
    if (isNaN(expiry.getTime())) return;
    if (c.membership && new Date(c.membership.expiryDate) >= expiry) return;
    let status = m.status || 'Active';
    if (status !== 'Suspended' && expiry < new Date()) status = 'Expired';
    c.membership = { plan: m.planName, expiryDate: expiry.toISOString(), status, serviceKey: m.serviceKey || '' };
  };

  for (const r of src.customers) {
    const c = touch(r.mobile, 'crm', 'customer', r.fullName, r.email);
    if (!c) continue;
    c.customerId = c.customerId || r.customerId || '';
    c.totalSpent = Math.max(c.totalSpent, Number(r.totalSpent) || 0);
  }
  for (const r of src.users) {
    const c = touch(r.mobile, 'app', 'customer', r.fullName, r.email);
    if (!c) continue;
    for (const v of r.vehicles || []) if (v.plateNumber) c.vehicles.add(String(v.plateNumber).toUpperCase().trim());
    if (r.membership && r.membership.status && r.membership.status !== 'None') addMembership(c, r.membership);
  }
  for (const r of src.staff) {
    const c = touch(r.mobile, 'staff', 'staff', r.fullName, r.email);
    if (!c) continue;
    c.department = r.department || '';
    c.staffRole = r.staffRole || '';
    c.staffActive = r.isActive !== false;
  }
  for (const r of src.bookings) {
    const c = touch(r.phone, 'booking', 'customer', r.customerName, r.customerEmail);
    if (c) addVisit(c, r);
  }
  for (const r of src.sales) {
    const c = touch(r.phone, 'sale', 'customer', r.customerName, r.customerEmail);
    if (!c) continue;
    addVisit(c, r);
  }
  for (const r of src.invoices) {
    const c = touch(r.phone, 'invoice', 'customer', r.customerName, r.customerEmail);
    if (!c) continue;
    addVisit(c, {
      serviceKey: r.departmentKey,
      vehicleNo: r.vehicleNo,
      createdAt: r.createdAt,
      packageName: (r.items || []).map((i) => i.name).filter(Boolean).join(' + ')
    });
  }
  for (const r of src.passes) {
    const c = touch(r.phone, 'membership', 'customer', r.customerName, r.customerEmail);
    if (!c) continue;
    for (const p of r.boundVehicles || []) if (p) c.vehicles.add(String(p).toUpperCase().trim());
    addMembership(c, r);
  }
  for (const r of src.vehicles) {
    const c = touch(r.ownerPhone, 'vehicle', 'customer', r.ownerName, r.ownerEmail);
    if (!c) continue;
    const label = [r.brand, r.model].filter(Boolean).join(' ');
    if (r.plateNumber) c.vehicles.add(`${String(r.plateNumber).toUpperCase().trim()}${label ? ` (${label})` : ''}`);
  }

  // People who messaged the business number but appear nowhere else are leads.
  const prefsByPhone = new Map(src.prefs.map((p) => [p.phone, p]));
  for (const p of src.prefs) {
    if (!map.has(p.phone) && (p.lastInboundAt || p.optIn)) {
      touch(p.phone, 'whatsapp', 'lead', p.profileName, '');
    }
  }

  const contacts = [];
  for (const c of map.values()) {
    const pref = prefsByPhone.get(c.phone) || {};
    // A plate stored both bare and with a model label is listed once, labelled.
    const vehicles = [...c.vehicles].filter((v, _i, all) =>
      v.includes('(') || !all.some((o) => o !== v && o.startsWith(`${v} (`)));
    const kinds = [...c.kinds];
    const name = c.name || pref.profileName || '';

    contacts.push({
      phone: c.phone,
      display: c.display,
      name,
      kind: kinds.includes('staff') ? 'staff' : (kinds.includes('customer') ? 'customer' : 'lead'),
      kinds,
      sources: [...c.sources],
      email: c.email,
      customerId: c.customerId,
      department: c.department,
      staffRole: c.staffRole,
      staffActive: c.staffActive,
      vehicles,
      serviceKeys: [...c.serviceKeys],
      totalSpent: c.totalSpent,
      visits: c.visits,
      lastVisitAt: c.lastVisitAt ? c.lastVisitAt.toISOString() : null,
      lastService: c.lastService,
      membership: c.membership,
      optIn: Boolean(pref.optIn),
      optedOut: Boolean(pref.optedOut),
      lastInboundAt: pref.lastInboundAt ? new Date(pref.lastInboundAt).toISOString() : null,
      lastInboundText: pref.lastInboundText || '',
      tags: pref.tags || [],
      vars: {
        name: name || '',
        firstName: (name || '').split(/\s+/)[0] || '',
        phone: c.display,
        vehicle: vehicles[0] || '',
        membershipPlan: c.membership ? c.membership.plan : '',
        membershipExpiry: c.membership ? formatDate(c.membership.expiryDate) : '',
        membershipStatus: c.membership ? c.membership.status : '',
        lastService: c.lastService || '',
        lastVisit: c.lastVisitAt ? formatDate(c.lastVisitAt) : '',
        department: c.department || '',
        businessName: 'The Shine Lounge'
      }
    });
  }

  contacts.sort((a, b) => (a.name || '~').localeCompare(b.name || '~'));
  return contacts;
};

const getContacts = async ({ force = false } = {}) => {
  if (!force && cache.contacts && Date.now() - cache.at < CACHE_MS) return cache.contacts;
  if (cache.pending) return cache.pending;
  cache.pending = buildContacts()
    .then((contacts) => {
      cache = { at: Date.now(), contacts, pending: null };
      return contacts;
    })
    .catch((err) => {
      cache.pending = null;
      throw err;
    });
  return cache.pending;
};

const invalidateContacts = () => { cache = { at: 0, contacts: null, pending: null }; };

module.exports = { getContacts, invalidateContacts, buildContacts };
