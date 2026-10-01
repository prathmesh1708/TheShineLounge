// One definition of what each admin-assigned staff permission unlocks in the
// staff app. Admin Manage Staff writes these keys to Staff.permissions; the
// staff app reads them through AuthContext / StaffContext.

// Always available regardless of assignment: home, selfie check-in, breaks,
// schedule, notifications and profile are part of every shift.
export const ALWAYS_ON_PERMISSIONS = ['dashboard'];

// Staff created before permissions were assigned have no array at all. They
// keep the access the department hubs grant by default rather than losing
// their job queue. An explicit empty array means the admin removed everything.
export const LEGACY_DEFAULT_PERMISSIONS = ['bookings', 'orders'];

export const STAFF_MODULES = [
  { key: 'bookings', label: 'Bookings', emoji: '📋' },
  { key: 'orders', label: 'Orders', emoji: '🧾' },
  { key: 'customers', label: 'Customers', emoji: '👥' },
  { key: 'memberships', label: 'Memberships', emoji: '🏷️' },
  { key: 'payments', label: 'Payments', emoji: '💳' },
  { key: 'inventory', label: 'Inventory', emoji: '📦' },
  { key: 'reports', label: 'Reports', emoji: '📊' }
];

// Staff routes that need a module, as "any of these permissions". Routes not
// listed here (dashboard, attendance, schedule, notifications, profile) are
// always open.
export const STAFF_ROUTE_PERMISSIONS = {
  bookings: ['bookings', 'orders'],
  customers: ['customers'],
  memberships: ['memberships'],
  invoicing: ['payments', 'orders']
};

export const normalizePermissions = (raw) => {
  if (!Array.isArray(raw)) return [...LEGACY_DEFAULT_PERMISSIONS];
  return [...new Set(raw.map((p) => String(p || '').trim().toLowerCase()).filter(Boolean))];
};

// `required` is one key or a list meaning "any of".
export const permissionsAllow = (permissions, required) => {
  const needed = (Array.isArray(required) ? required : [required]).filter(Boolean);
  if (needed.length === 0) return true;
  if (needed.some((key) => ALWAYS_ON_PERMISSIONS.includes(key))) return true;
  const granted = normalizePermissions(permissions);
  return needed.some((key) => granted.includes(key));
};

// '/staff/invoicing/123' -> ['payments', 'orders']; null when the route is open.
export const permissionsForStaffPath = (pathname) => {
  const segment = String(pathname || '').replace(/^\/staff\/?/, '').split('/')[0];
  return STAFF_ROUTE_PERMISSIONS[segment] || null;
};

export const samePermissions = (a, b) => {
  const x = normalizePermissions(a).sort();
  const y = normalizePermissions(b).sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
};
