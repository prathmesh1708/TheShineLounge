const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const bcrypt = require('bcryptjs');

const seedRealData = async () => {
  try {
    // Clean up existing misclassified staff in MongoDB
    try {
      await User.updateMany(
        { role: 'staff', staffRole: { $regex: /cafe supervisor|barista|pastry|chef/i } },
        { $set: { department: 'Café', serviceKey: 'cafe' } }
      );
      await User.updateMany(
        { role: 'staff', staffRole: { $regex: /drive-thru|drive-through/i } },
        { $set: { department: 'Drive-Through Café', serviceKey: 'drive-through-cafe' } }
      );
      await User.updateMany(
        { role: 'staff', staffRole: { $regex: /detail/i } },
        { $set: { department: 'Car Detailing', serviceKey: 'car-detailing' } }
      );
      await User.updateMany(
        { role: 'staff', staffRole: { $regex: /groomer|pet/i } },
        { $set: { department: 'Dog Wash', serviceKey: 'dog-wash' } }
      );
      await User.updateMany(
        { role: 'staff', staffRole: { $regex: /salon|barber|stylist/i } },
        { $set: { department: "Men's Salon", serviceKey: 'salon' } }
      );
    } catch (err) {
      console.warn('Staff cleanup notice:', err.message);
    }

    // 1. Check if staff already exists
    const existingStaffCount = await User.countDocuments({ role: 'staff' });
    if (existingStaffCount > 0) {
      console.log('Database staff members updated cleanly.');
      return;
    }

    console.log('🌱 Seeding realistic database entries (Staff, Customers, Bookings)...');

    // Helper: hash password
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    // 2. Seed Staff Members
    const staffData = [
      {
        fullName: 'Rajesh Patel',
        email: 'rajesh@theshinelounge.com',
        password: hashedPassword,
        mobile: '+91 98200 11111',
        role: 'staff',
        department: 'Car Wash',
        staffRole: 'Senior Wash Specialist',
        salary: '₹35,000 / month',
        leaveBalance: 12,
        serviceKey: 'car-wash',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        permissions: ['bookings', 'orders']
      },
      {
        fullName: 'Vikram Singh',
        email: 'vikram@theshinelounge.com',
        password: hashedPassword,
        mobile: '+91 98200 22222',
        role: 'staff',
        department: 'Detailing',
        staffRole: 'Detailing Master craftsman',
        salary: '₹45,000 / month',
        leaveBalance: 10,
        serviceKey: 'car-detailing',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        permissions: ['bookings', 'orders', 'inventory']
      },
      {
        fullName: 'Rohan Deshmukh',
        email: 'rohan@theshinelounge.com',
        password: hashedPassword,
        mobile: '+91 98200 33333',
        role: 'staff',
        department: 'Car Wash',
        staffRole: 'Wash Supervisor',
        salary: '₹38,000 / month',
        leaveBalance: 14,
        serviceKey: 'car-wash',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        permissions: ['bookings', 'orders']
      },
      {
        fullName: 'Anita Sen',
        email: 'anita@theshinelounge.com',
        password: hashedPassword,
        mobile: '+91 98200 44444',
        role: 'staff',
        department: 'Salon',
        staffRole: 'Salon Specialist',
        salary: '₹40,000 / month',
        leaveBalance: 15,
        serviceKey: 'salon',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        permissions: ['bookings', 'customers']
      },
      {
        fullName: 'Kabir Mehta',
        email: 'kabir@theshinelounge.com',
        password: hashedPassword,
        mobile: '+91 98200 55555',
        role: 'staff',
        department: 'Cafe',
        staffRole: 'Head Barista',
        salary: '₹32,000 / month',
        leaveBalance: 12,
        serviceKey: 'cafe',
        photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
        permissions: ['orders', 'inventory']
      }
    ];

    const seededStaff = await User.insertMany(staffData);
    console.log(`✅ Seeded ${seededStaff.length} Staff members.`);

    // 3. Seed Customer Users
    const customerData = [
      {
        fullName: 'Prathmesh Jawade',
        email: 'prathmesh@gmail.com',
        password: hashedPassword,
        mobile: '+91 98200 99999',
        role: 'user'
      },
      {
        fullName: 'Amit Sharma',
        email: 'amit.sharma@gmail.com',
        password: hashedPassword,
        mobile: '+91 98111 22222',
        role: 'user'
      },
      {
        fullName: 'Neha Kapoor',
        email: 'neha.k@gmail.com',
        password: hashedPassword,
        mobile: '+91 98333 44444',
        role: 'user'
      },
      {
        fullName: 'Rahul Verma',
        email: 'rahul.verma@gmail.com',
        password: hashedPassword,
        mobile: '+91 98444 55555',
        role: 'user'
      },
      {
        fullName: 'Sneha Patel',
        email: 'sneha.patel@gmail.com',
        password: hashedPassword,
        mobile: '+91 98555 66666',
        role: 'user'
      }
    ];

    const seededCustomers = await User.insertMany(customerData);
    console.log(`✅ Seeded ${seededCustomers.length} Customer users.`);

    // 4. Seed Bookings
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const bookingData = [
      {
        bookingId: 'B-2026-8801',
        serviceKey: 'car-wash',
        serviceName: 'Car Wash',
        packageName: 'Platinum Wash & Dry',
        price: 1200,
        date: todayStr,
        timeSlot: '09:00 AM - 10:00 AM',
        customerName: 'Amit Sharma',
        customerEmail: 'amit.sharma@gmail.com',
        vehicleNo: 'MH-02-CP-4455',
        vehicleType: 'Tesla Model S',
        status: 'In Progress',
        stepIndex: 2,
        notes: 'Needs extra attention on alloy wheels.',
        assignedStaffId: seededStaff[0]._id,
        assignedStaffName: seededStaff[0].fullName
      },
      {
        bookingId: 'B-2026-8802',
        serviceKey: 'car-wash',
        serviceName: 'Car Wash',
        packageName: 'Express Underbody Clean',
        price: 800,
        date: todayStr,
        timeSlot: '11:30 AM - 12:30 PM',
        customerName: 'Neha Kapoor',
        customerEmail: 'neha.k@gmail.com',
        vehicleNo: 'MH-01-AB-1234',
        vehicleType: 'BMW 3 Series',
        status: 'Confirmed',
        stepIndex: 1,
        notes: 'Pre-rinse request.',
        assignedStaffId: seededStaff[2]._id,
        assignedStaffName: seededStaff[2].fullName
      },
      {
        bookingId: 'B-2026-8803',
        serviceKey: 'car-wash',
        serviceName: 'Car Wash',
        packageName: 'Platinum Wash & Dry',
        price: 1200,
        date: todayStr,
        timeSlot: '02:00 PM - 03:00 PM',
        customerName: 'Rahul Verma',
        customerEmail: 'rahul.verma@gmail.com',
        vehicleNo: 'MH-12-FG-5678',
        vehicleType: 'Audi A6',
        status: 'Pending',
        stepIndex: 0,
        notes: '',
        assignedStaffId: null,
        assignedStaffName: ''
      },
      {
        bookingId: 'B-2026-8804',
        serviceKey: 'car-wash',
        serviceName: 'Car Wash',
        packageName: 'Platinum Wash & Dry',
        price: 1200,
        date: yesterdayStr,
        timeSlot: '04:00 PM - 05:00 PM',
        customerName: 'Sneha Patel',
        customerEmail: 'sneha.patel@gmail.com',
        vehicleNo: 'MH-04-DZ-8989',
        vehicleType: 'Hyundai Creta',
        status: 'Completed',
        stepIndex: 4,
        notes: 'Cleaned and polished.',
        assignedStaffId: seededStaff[0]._id,
        assignedStaffName: seededStaff[0].fullName
      },
      {
        bookingId: 'B-2026-8805',
        serviceKey: 'car-detailing',
        serviceName: 'Car Detailing',
        packageName: 'Ceramic Coating Prep',
        price: 4999,
        date: tomorrowStr,
        timeSlot: '10:00 AM - 01:00 PM',
        customerName: 'Prathmesh Jawade',
        customerEmail: 'prathmesh@gmail.com',
        vehicleNo: 'MH-02-EE-7777',
        vehicleType: 'Porsche Macan',
        status: 'Confirmed',
        stepIndex: 0,
        notes: 'Full exterior decontamination and prep.',
        assignedStaffId: seededStaff[1]._id,
        assignedStaffName: seededStaff[1].fullName
      }
    ];

    const seededBookings = await Booking.insertMany(bookingData);
    console.log(`✅ Seeded ${seededBookings.length} Bookings.`);
  } catch (error) {
    console.error('❌ Error seeding realistic database data:', error.message);
  }
};

module.exports = seedRealData;
