// One definition of "what a user is allowed to see about themselves".
//
// The auth endpoints and the self-service endpoints used to each build their
// own response object by hand, which is how `vehicles` and `membership` ended
// up missing from /api/auth/me while the customer app was already reading
// `user.vehicles` — the app saw an empty garage and substituted demo cars.
// Building every payload here means a field is either exposed everywhere or
// nowhere, and internal bookkeeping never leaks by accident.

// Derived from the stored dates rather than trusting `membership.status`, which
// an admin sets once and which silently goes stale the day a plan expires.
const computeMembershipStatus = (user) => {
  const membership = user && user.membership;
  if (!membership || !membership.planName || membership.status === 'None') {
    return 'Regular Customer';
  }
  if (membership.status === 'Suspended') {
    return 'Suspended Member';
  }

  const now = new Date();
  const expiry = membership.expiryDate ? new Date(membership.expiryDate) : null;

  if (!expiry || expiry < now) {
    return 'Expired Member';
  }

  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
  if (diffDays <= 7) {
    return 'Due for Renewal';
  }

  return 'Active Member';
};

// Vehicles are echoed back with the same `_id` Mongo assigned to the subdocument
// so the client can address one for deletion without inventing its own key.
const sanitizeVehicle = (vehicle) => {
  if (!vehicle) return null;
  return {
    _id: vehicle._id ? String(vehicle._id) : undefined,
    plateNumber: vehicle.plateNumber || '',
    plateNormalized: vehicle.plateNormalized || '',
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    year: vehicle.year || '',
    category: vehicle.category || 'Car',
    isPrimary: Boolean(vehicle.isPrimary),
    addedVia: vehicle.addedVia || 'self',
    verifiedAt: vehicle.verifiedAt || null
  };
};

// A vehicle with no plate is an empty row left behind by a half-finished edit.
// It is not a car, so it must not be counted as one on any screen.
const sanitizeVehicles = (vehicles) =>
  (vehicles || []).filter((v) => v && v.plateNumber).map(sanitizeVehicle);

// `misuseAlerts` is the admin-side audit trail of suspected abuse. The customer
// is told *that* they are suspended and why, but the investigation notes behind
// it stay on the admin endpoints.
const sanitizeMembership = (user) => {
  const membership = user && user.membership;
  if (!membership || !membership.planName) {
    return {
      planName: '',
      status: 'None',
      segment: 'Regular Customer',
      isActive: false
    };
  }

  const segment = computeMembershipStatus(user);

  return {
    planName: membership.planName || '',
    serviceKey: membership.serviceKey || 'car-wash',
    startDate: membership.startDate || null,
    expiryDate: membership.expiryDate || null,
    status: membership.status || 'None',
    segment,
    isActive: segment === 'Active Member' || segment === 'Due for Renewal',
    suspensionReason: membership.suspensionReason || '',
    maxPerDay: membership.maxPerDay,
    maxPerMonth: membership.maxPerMonth,
    coolOffHours: membership.coolOffHours,
    boundVehiclesOnly: Boolean(membership.boundVehiclesOnly),
    boundVehicles: membership.boundVehicles || [],
    unlimited: Boolean(membership.unlimited),
    washesRemaining: membership.washesRemaining === undefined ? null : membership.washesRemaining,
    usageCountToday: membership.usageCountToday || 0,
    usageCountMonth: membership.usageCountMonth || 0,
    lastUsedAt: membership.lastUsedAt || null
  };
};

// Admins live in a separate collection and carry neither vehicles nor a
// membership; they get the same shape with those parts empty so callers never
// have to branch on which collection the account came from.
const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile || '',
    role: user.role,
    department: user.department,
    permissions: user.permissions,
    profileImage: user.profileImage,
    branch: user.branch,
    city: user.city,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    loyaltyPoints: user.loyaltyPoints || 0,
    totalSpent: user.totalSpent || 0,
    vehicles: sanitizeVehicles(user.vehicles),
    membership: sanitizeMembership(user)
  };
};

module.exports = {
  computeMembershipStatus,
  sanitizeVehicle,
  sanitizeVehicles,
  sanitizeMembership,
  sanitizeUser
};
