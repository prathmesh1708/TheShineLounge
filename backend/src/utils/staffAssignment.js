const User = require('../models/User');
const Notification = require('../models/Notification');

// Department names an admin can pick in Manage Staff, mapped to the serviceKey
// used on bookings. Several spellings exist in the User schema enum, so every
// accepted variant is listed here.
const SERVICE_KEY_TO_DEPARTMENTS = {
  'car-wash': ['Car Wash'],
  'car-detailing': ['Car Detailing', 'Detailing'],
  'dog-wash': ['Dog Wash'],
  'cafe': ['Cafe', 'Café'],
  'drive-through-cafe': [
    'Drive-Through Cafe',
    'Drive-Through Café',
    'Drive-Thru Cafe',
    'Drive-Thru Café'
  ],
  'salon': ['Salon', "Men's Salon"]
};

// Find the staff member an admin has put in charge of this service. Prefers an
// explicit serviceKey on the staff record, then falls back to the department
// dropdown value. Returns null when nobody is staffed on that service.
const findStaffForService = async (serviceKey) => {
  if (!serviceKey) return null;

  const departments = SERVICE_KEY_TO_DEPARTMENTS[serviceKey] || [];

  const staff = await User.findOne({
    role: 'staff',
    isActive: true,
    isDeleted: { $ne: true },
    $or: [
      { serviceKey },
      { department: { $in: departments } }
    ]
  }).sort({ createdAt: 1 });

  return staff || null;
};

// Raise an in-app notification aimed at one specific staff member. Safe to call
// on the booking path: a notification failure must never fail the booking.
const notifyStaffOfBooking = async (staff, booking) => {
  if (!staff || !booking) return null;

  const isDriveThrough = booking.serviceKey === 'drive-through-cafe';
  const vehicleLabel = booking.vehicleNo
    ? `${booking.vehicleNo}${booking.vehicleType ? ` (${booking.vehicleType})` : ''}`
    : 'vehicle not registered';

  const itemsLabel = (booking.items || [])
    .map((i) => `${i.quantity}x ${i.name}`)
    .join(', ');

  const title = isDriveThrough
    ? `New drive-through order · ${booking.bookingId}`
    : `New ${booking.serviceName} booking · ${booking.bookingId}`;

  const messageParts = [
    `${booking.customerName} is arriving ${booking.pickupTime || booking.timeSlot}.`,
    `Vehicle: ${vehicleLabel}.`
  ];
  if (itemsLabel) messageParts.push(`Order: ${itemsLabel}.`);
  messageParts.push(`Total ₹${booking.price}.`);

  try {
    return await Notification.create({
      title,
      message: messageParts.join(' '),
      recipientType: 'staff',
      targetUserId: staff._id,
      serviceKey: booking.serviceKey,
      category: 'order_status',
      priority: isDriveThrough ? 'urgent' : 'high',
      actionUrl: '/staff/bookings'
    });
  } catch (error) {
    console.warn('Could not create staff notification:', error.message);
    return null;
  }
};

module.exports = {
  SERVICE_KEY_TO_DEPARTMENTS,
  findStaffForService,
  notifyStaffOfBooking
};
