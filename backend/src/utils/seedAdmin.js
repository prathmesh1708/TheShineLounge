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
    // password has `select: false` on the schema, so it has to be requested
    // explicitly or matchPassword() below gets undefined and bcrypt throws.
    const existingAdminDoc = await Admin.findOne({ email: targetEmail, isDeleted: false }).select('+password');
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
      // Comparing against the stored hash instead of unconditionally
      // reassigning avoids a needless bcrypt re-hash (cost 12, ~100-300ms)
      // every time this runs when nothing actually changed.
      const passwordMatches = await existingAdminDoc.matchPassword(targetPass);
      const alreadyCorrect = passwordMatches
        && existingAdminDoc.role === 'admin'
        && existingAdminDoc.isActive
        && ALL_PERMISSIONS.every((p) => existingAdminDoc.permissions.includes(p));

      if (!alreadyCorrect) {
        if (!passwordMatches) existingAdminDoc.password = targetPass;
        existingAdminDoc.role = 'admin';
        existingAdminDoc.isActive = true;
        existingAdminDoc.permissions = ALL_PERMISSIONS;
        await existingAdminDoc.save();
        console.log(`✅ Admin Model account verified & updated (${targetEmail})`);
      }
    }

    // 2. Seed into User Model
    const existingUserDoc = await User.findOne({ email: targetEmail, isDeleted: false }).select('+password');
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
      const passwordMatches = await existingUserDoc.matchPassword(targetPass);
      const alreadyCorrect = passwordMatches
        && existingUserDoc.role === 'admin'
        && existingUserDoc.isActive
        && ALL_PERMISSIONS.every((p) => existingUserDoc.permissions.includes(p));

      if (!alreadyCorrect) {
        if (!passwordMatches) existingUserDoc.password = targetPass;
        existingUserDoc.role = 'admin';
        existingUserDoc.isActive = true;
        existingUserDoc.permissions = ALL_PERMISSIONS;
        await existingUserDoc.save();
        console.log(`✅ User Model Admin verified & updated (${targetEmail})`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
