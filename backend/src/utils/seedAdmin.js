const User = require('../models/User');
const Admin = require('../models/Admin');
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
    const targetEmail = ADMIN_EMAIL || 'admin@gmail.com';
    const targetPass = ADMIN_PASSWORD || 'Admin!@#123';

    // 1. Seed into Admin Model
    const existingAdminDoc = await Admin.findOne({ email: targetEmail, isDeleted: false });
    if (!existingAdminDoc) {
      await Admin.create({
        fullName: 'Super Admin',
        email: targetEmail,
        password: targetPass,
        mobile: '+91 00000 00000',
        role: 'admin',
        department: 'Management',
        permissions: ALL_PERMISSIONS,
        isActive: true,
        branch: 'Main Branch'
      });
      console.log(`✅ Admin Model seeded successfully (${targetEmail})`);
    } else {
      existingAdminDoc.password = targetPass;
      existingAdminDoc.role = 'admin';
      existingAdminDoc.isActive = true;
      existingAdminDoc.permissions = ALL_PERMISSIONS;
      await existingAdminDoc.save();
      console.log(`✅ Admin Model account verified & updated (${targetEmail})`);
    }

    // 2. Seed into User Model
    const existingUserDoc = await User.findOne({ email: targetEmail, isDeleted: false });
    if (!existingUserDoc) {
      await User.create({
        fullName: 'Super Admin',
        email: targetEmail,
        password: targetPass,
        mobile: '+91 00000 00000',
        role: 'admin',
        department: 'Management',
        permissions: ALL_PERMISSIONS,
        isActive: true,
        branch: 'Main Branch'
      });
      console.log(`✅ User Model Admin seeded successfully (${targetEmail})`);
    } else {
      existingUserDoc.password = targetPass;
      existingUserDoc.role = 'admin';
      existingUserDoc.isActive = true;
      existingUserDoc.permissions = ALL_PERMISSIONS;
      await existingUserDoc.save();
      console.log(`✅ User Model Admin verified & updated (${targetEmail})`);
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
