const User = require('../models/User');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('../common/config/env');

const ALL_PERMISSIONS = [
  'dashboard',
  'bookings',
  'memberships',
  'customers',
  'orders',
  'inventory',
  'reports',
  'payments'
];

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin', isDeleted: false });

    if (existingAdmin) {
      console.log('Admin account already exists. Skipping seed.');
      return;
    }

    const admin = await User.create({
      fullName: 'Super Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      mobile: '+91 00000 00000',
      role: 'admin',
      department: 'Management',
      permissions: ALL_PERMISSIONS,
      isActive: true,
      branch: 'Main Branch'
    });

    console.log(`✅ Super Admin seeded successfully (${admin.email})`);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
