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
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL, isDeleted: false });

    if (!existingAdmin) {
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
    } else {
      // Update password hash and permissions if needed
      existingAdmin.password = ADMIN_PASSWORD;
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.permissions = ALL_PERMISSIONS;
      await existingAdmin.save();
      console.log(`✅ Super Admin account verified & updated (${existingAdmin.email})`);
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
