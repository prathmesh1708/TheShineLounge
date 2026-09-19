const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://shine_database:9Dpdo5pVLsx611qB@cluster0.p0edhnc.mongodb.net/shine';

const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const RegisteredVehicle = require('../models/RegisteredVehicle');
const MembershipPass = require('../models/MembershipPass');
const OfflineSale = require('../models/OfflineSale');
const Booking = require('../models/Booking');

async function migrateData() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas DB:', mongoose.connection.name);

    const db = mongoose.connection.db;

    // 1. Migrate Staff
    const rawUsers = await db.collection('users').find({}).toArray();
    console.log(`Processing ${rawUsers.length} raw users...`);

    let staffCount = 0;
    let customerCount = 0;
    let vehicleCount = 0;

    for (const u of rawUsers) {
      if (u.role === 'staff') {
        const staffId = u.staffId || `STF-${Math.floor(100 + Math.random() * 900)}`;
        await Staff.updateOne(
          { email: u.email.toLowerCase().trim() },
          {
            $setOnInsert: {
              staffId,
              fullName: u.fullName,
              email: u.email.toLowerCase().trim(),
              password: u.password || '$2a$12$eInK5bW4K9d3vJ0y...', // Default hashed if missing
              mobile: u.mobile || '',
              department: u.department || 'Car Wash',
              serviceKey: u.serviceKey || 'car-wash',
              staffRole: u.staffRole || 'Staff Specialist',
              salary: u.salary || '',
              leaveBalance: u.leaveBalance || 12,
              permissions: u.permissions || [],
              photo: u.photo || '',
              branch: u.branch || 'Main Branch',
              isActive: u.isActive !== undefined ? u.isActive : true
            }
          },
          { upsert: true }
        );
        staffCount++;
      } else if (u.role === 'user' || !u.role) {
        const customerId = u.customerId || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
        await Customer.updateOne(
          { $or: [{ email: u.email ? u.email.toLowerCase().trim() : '___none___' }, { customerId }] },
          {
            $setOnInsert: {
              customerId,
              fullName: u.fullName || 'Valued Customer',
              email: u.email ? u.email.toLowerCase().trim() : '',
              password: u.password || '',
              mobile: u.mobile || '',
              city: u.city || 'Mumbai',
              loyaltyPoints: u.loyaltyPoints || 0,
              totalSpent: u.totalSpent || 0,
              segment: u.segment || 'Regular Customer',
              isActive: u.isActive !== undefined ? u.isActive : true
            }
          },
          { upsert: true }
        );
        customerCount++;

        // Migrate embedded vehicles to registeredvehicles collection
        if (Array.isArray(u.vehicles)) {
          for (const v of u.vehicles) {
            if (v && v.plateNumber) {
              const cleanPlate = String(v.plateNumber).toUpperCase().trim();
              const vehicleId = `VEH-${cleanPlate.replace(/[^A-Z0-9]/g, '')}`;
              await RegisteredVehicle.updateOne(
                { plateNormalized: cleanPlate.replace(/[^A-Z0-9]/g, '') },
                {
                  $setOnInsert: {
                    vehicleId,
                    plateNumber: cleanPlate,
                    plateNormalized: cleanPlate.replace(/[^A-Z0-9]/g, ''),
                    brand: v.brand || '',
                    model: v.model || '',
                    category: v.category || 'Car',
                    year: v.year || '',
                    ownerName: u.fullName || 'Customer',
                    ownerEmail: u.email || '',
                    ownerPhone: u.mobile || '',
                    customerId,
                    addedVia: v.addedVia || 'self'
                  }
                },
                { upsert: true }
              );
              vehicleCount++;
            }
          }
        }
      }
    }

    console.log(`✅ Staff migrated: ${staffCount}`);
    console.log(`✅ Customers migrated: ${customerCount}`);
    console.log(`✅ Vehicles migrated: ${vehicleCount}`);

    // 2. Migrate Offline Sales & Memberships from raw bookings
    const rawBookings = await db.collection('bookings').find({}).toArray();
    console.log(`Processing ${rawBookings.length} raw bookings...`);

    let offlineCount = 0;
    let membershipCount = 0;
    let bookingCount = 0;

    for (const b of rawBookings) {
      if (b.isOfflineSale || (b.bookingId && String(b.bookingId).startsWith('OFS-'))) {
        const saleId = b.bookingId || `OFS-TSH-${Math.floor(10 + Math.random() * 90)}`;
        await OfflineSale.updateOne(
          { saleId },
          {
            $setOnInsert: {
              saleId,
              customerName: b.customerName || 'Valued Customer',
              customerEmail: b.customerEmail || '',
              phone: b.phone || '',
              vehicleNo: b.vehicleNo || '',
              vehicleType: b.vehicleType || '',
              serviceKey: b.serviceKey || 'car-wash',
              serviceName: b.serviceName || 'Car Wash',
              packageName: b.packageName || 'Single Wash',
              price: Number(b.price) || 0,
              subtotal: Number(b.subtotal) || Number(b.price) || 0,
              gstAmount: Number(b.gstAmount) || 0,
              includeGst: Boolean(b.includeGst),
              paymentMode: b.paymentMode || 'Cash',
              saleDate: b.saleDate || b.date || '',
              saleType: b.saleType || 'service',
              staffName: b.assignedStaffName || '',
              notes: b.notes || ''
            }
          },
          { upsert: true }
        );
        offlineCount++;
      } else if (b.saleType === 'membership' || (b.packageName && b.packageName.toLowerCase().includes('membership'))) {
        const passId = b.bookingId || `MEM-2026-${Math.floor(100 + Math.random() * 900)}`;
        await MembershipPass.updateOne(
          { passId },
          {
            $setOnInsert: {
              passId,
              planName: b.packageName || 'Monthly Membership',
              serviceKey: b.serviceKey || 'car-wash',
              customerName: b.customerName || 'Valued Customer',
              customerEmail: b.customerEmail || '',
              phone: b.phone || '',
              boundVehicles: b.vehicleNo ? [b.vehicleNo] : [],
              startDate: b.createdAt || new Date(),
              expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
              status: 'Active',
              washesRemaining: 4,
              washesUsed: 0,
              amountPaid: Number(b.price) || 0,
              paymentMode: b.paymentMode || 'Cash',
              purchasedVia: 'pos'
            }
          },
          { upsert: true }
        );
        membershipCount++;
      } else {
        bookingCount++;
      }
    }

    console.log(`✅ Offline Sales migrated: ${offlineCount}`);
    console.log(`✅ Memberships migrated: ${membershipCount}`);
    console.log(`✅ Online Bookings retained: ${bookingCount}`);

    console.log('\n🎉 Decoupled collections migration completed successfully!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
}

migrateData();
