const OfflineSale = require('../models/OfflineSale');
const MembershipPass = require('../models/MembershipPass');
const { toIsoDate } = require('../utils/dateFormat');

// Mirrors a booking into the dedicated offlinesales / memberships collections.
//
// The admin POS posts everything to /api/bookings, so a counter sale lands in
// `bookings` with isOfflineSale, and a membership lands there with
// saleType: 'membership'. The isolated collections the newer backend reads were
// left to be filled by endpoints the frontend never calls, which is why they sat
// empty while sales piled up. Rather than rewrite the POS flow, the booking
// write now fans out to them.
//
// Both writes key off the booking's own id, so they are idempotent: replaying a
// booking updates its mirror instead of creating a second one.

const parseDate = (value, fallback = null) => {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
};

// "30 Days" -> 30. Used only when a booking carries no explicit expiry.
const daysFromValidity = (validity) => {
  const match = String(validity || '').match(/(\d+)\s*day/i);
  if (match) return Number(match[1]);
  if (/year/i.test(validity || '')) return 365;
  if (/month/i.test(validity || '')) return 30;
  return 30;
};

const isOfflineSaleBooking = (b) =>
  Boolean(b && (b.isOfflineSale || String(b.bookingId || '').startsWith('OFS-')));

const isMembershipBooking = (b) =>
  Boolean(b && (b.saleType === 'membership' || b.membershipName));

const mirrorOfflineSale = async (booking) => {
  if (!isOfflineSaleBooking(booking)) return null;

  const saleId = booking.bookingId || String(booking._id);
  if (!saleId) return null;

  const vehicles = Array.isArray(booking.vehicles) && booking.vehicles.length > 0
    ? booking.vehicles.map(v => ({
        plateNumber: (v.plateNumber || v.plate || '').toUpperCase().trim(),
        model: v.model || v.vehicleModel || '',
        brand: v.brand || '',
        category: v.category || 'Car'
      })).filter(v => Boolean(v.plateNumber))
    : [];

  const doc = {
    customerName: booking.customerName || 'Walk-in Customer',
    customerEmail: (booking.customerEmail || '').toLowerCase().trim(),
    phone: booking.phone || '',
    vehicleNo: booking.vehicleNo || (vehicles[0]?.plateNumber || ''),
    vehicleType: booking.vehicleType || booking.vehicleModel || (vehicles[0]?.model || ''),
    vehicles: vehicles.length > 0 ? vehicles : (booking.vehicleNo ? [{
      plateNumber: (booking.vehicleNo || '').toUpperCase().trim(),
      model: booking.vehicleType || booking.vehicleModel || '',
      brand: '',
      category: 'Car'
    }] : []),
    serviceKey: booking.serviceKey || 'car-wash',
    serviceName: booking.serviceName || 'Car Wash',
    packageName: booking.packageName || booking.membershipName || 'Single Wash',
    price: Number(booking.price) || 0,
    subtotal: Number(booking.subtotal) || Number(booking.price) || 0,
    gstAmount: Number(booking.gstAmount) || 0,
    includeGst: Boolean(booking.includeGst),
    paymentMode: booking.paymentMode || 'Cash',
    saleDate: toIsoDate(booking.saleDate || booking.date) || new Date().toISOString().split('T')[0],
    saleType: booking.saleType || 'service',
    staffId: booking.staffId || null,
    staffName: booking.staffAssigned || booking.staffName || '',
    notes: booking.notes || ''
  };

  await OfflineSale.updateOne(
    { saleId },
    { $set: doc, $setOnInsert: { saleId } },
    { upsert: true }
  );

  return OfflineSale.findOne({ saleId });
};

const mirrorMembershipPass = async (booking) => {
  if (!isMembershipBooking(booking)) return null;

  const sourceId = booking.bookingId || String(booking._id);
  if (!sourceId) return null;

  // Derived from the booking id so the pass is traceable back to the sale and
  // a replay cannot mint a duplicate.
  const passId = String(sourceId).startsWith('MEM-') ? sourceId : `MEM-${sourceId}`;

  const startDate = parseDate(booking.saleDate || booking.date, new Date());
  const expiryDate =
    parseDate(booking.membershipExpiry) ||
    new Date(startDate.getTime() + daysFromValidity(booking.membershipValidity) * 24 * 3600 * 1000);

  const plate = (booking.vehicleNo || '').toUpperCase().trim();
  const vehiclePlates = Array.isArray(booking.vehicles) && booking.vehicles.length > 0
    ? booking.vehicles.map(v => (v.plateNumber || v.plate || '').toUpperCase().trim()).filter(Boolean)
    : (plate ? [plate] : []);

  const doc = {
    planName: booking.membershipName || booking.packageName || 'Monthly Membership',
    serviceKey: booking.serviceKey || 'car-wash',
    customerName: booking.customerName || 'Valued Member',
    customerEmail: (booking.customerEmail || '').toLowerCase().trim(),
    phone: booking.phone || '',
    boundVehicles: vehiclePlates.length > 0 ? Array.from(new Set(vehiclePlates)) : [],
    startDate,
    expiryDate,
    status: booking.status === 'Cancelled' ? 'Suspended' : 'Active',
    washesUsed: Number(booking.washesUsed) || 0,
    amountPaid: Number(booking.price) || 0,
    paymentMode: booking.paymentMode || 'Cash',
    purchasedVia: isOfflineSaleBooking(booking) ? 'pos' : 'staff'
  };

  if (booking.maxWashes !== undefined && booking.maxWashes !== null) {
    doc.washesRemaining = Number(booking.maxWashes) - doc.washesUsed;
  }

  await MembershipPass.updateOne(
    { passId },
    { $set: doc, $setOnInsert: { passId } },
    { upsert: true }
  );

  return MembershipPass.findOne({ passId });
};

// Mirroring is derived bookkeeping. It must never be the reason a sale fails to
// save, so failures are logged and swallowed.
const tryMirrorBooking = async (booking) => {
  const results = { offlineSale: null, membershipPass: null };
  try {
    results.offlineSale = await mirrorOfflineSale(booking);
  } catch (err) {
    console.warn('Could not mirror offline sale:', err.message);
  }
  try {
    results.membershipPass = await mirrorMembershipPass(booking);
  } catch (err) {
    console.warn('Could not mirror membership pass:', err.message);
  }
  return results;
};

// Keeps the mirrors in step when a booking is removed from the admin UI.
const trySoftDeleteMirrors = async (booking) => {
  const sourceId = booking && (booking.bookingId || String(booking._id));
  if (!sourceId) return;
  try {
    await OfflineSale.updateOne({ saleId: sourceId }, { $set: { isDeleted: true } });
    const passId = String(sourceId).startsWith('MEM-') ? sourceId : `MEM-${sourceId}`;
    await MembershipPass.updateOne({ passId }, { $set: { isDeleted: true } });
  } catch (err) {
    console.warn('Could not soft-delete sale mirrors:', err.message);
  }
};

module.exports = {
  mirrorOfflineSale,
  mirrorMembershipPass,
  tryMirrorBooking,
  trySoftDeleteMirrors,
  isOfflineSaleBooking,
  isMembershipBooking
};
