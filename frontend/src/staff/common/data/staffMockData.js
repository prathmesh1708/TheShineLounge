// Comprehensive Unified Mock Data for The Shine Lounge Staff Panel
// Follows Indian Context: INR (₹), 18% GST, Indian Names, Vehicles (e.g. MH01AB1234), Indian Phones (+91)

export const mockStaffMembers = [
  {
    id: 'STF-01',
    employeeId: 'STF-01',
    name: 'Amitabh Verma',
    role: 'Super Admin',
    department: 'Management',
    serviceKey: 'global',
    phone: '+91 98210 11111',
    email: 'amitabh@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    salary: '₹1,20,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 10, sick: 7, earned: 14 }
  },
  {
    id: 'STF-02',
    employeeId: 'STF-02',
    name: 'Rajesh Gaikwad',
    role: 'Branch Manager',
    department: 'Management',
    serviceKey: 'global',
    phone: '+91 98210 22222',
    email: 'rajesh.g@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    salary: '₹65,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 8, sick: 5, earned: 12 }
  },

  // Car Wash Staff
  {
    id: 'STF-03',
    employeeId: 'STF-03',
    name: 'Rohan Deshmukh',
    role: 'Car Wash Lead',
    department: 'Car Wash',
    serviceKey: 'car-wash',
    phone: '+91 98210 33333',
    email: 'rohan@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    salary: '₹35,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 6, sick: 4, earned: 10 }
  },
  {
    id: 'STF-04',
    employeeId: 'STF-04',
    name: 'Vijay Shinde',
    role: 'Car Wash Lead',
    department: 'Car Wash',
    serviceKey: 'car-wash',
    phone: '+91 98210 33344',
    email: 'vijay@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    salary: '₹28,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 5, sick: 3, earned: 8 }
  },

  // Car Detailing Staff
  {
    id: 'STF-05',
    employeeId: 'STF-05',
    name: 'Deepak Joshi',
    role: 'Detailing Specialist',
    department: 'Car Detailing',
    serviceKey: 'car-detailing',
    phone: '+91 98210 55555',
    email: 'deepak@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    salary: '₹48,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 7, sick: 5, earned: 11 }
  },
  {
    id: 'STF-06',
    employeeId: 'STF-06',
    name: 'Amit Saxena',
    role: 'Detailing Specialist',
    department: 'Car Detailing',
    serviceKey: 'car-detailing',
    phone: '+91 98210 55566',
    email: 'amit.s@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    salary: '₹42,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 4, sick: 2, earned: 9 }
  },

  // Dog Grooming Staff
  {
    id: 'STF-07',
    employeeId: 'STF-07',
    name: 'Sneha Rao',
    role: 'Dog Groomer',
    department: 'Dog Wash',
    serviceKey: 'dog-wash',
    phone: '+91 98210 66666',
    email: 'sneha@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    salary: '₹38,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 8, sick: 6, earned: 12 }
  },
  {
    id: 'STF-08',
    employeeId: 'STF-08',
    name: 'Pooja Kulkarni',
    role: 'Dog Groomer',
    department: 'Dog Wash',
    serviceKey: 'dog-wash',
    phone: '+91 98210 66677',
    email: 'pooja.k@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    salary: '₹26,000 / mo',
    status: 'On Break',
    leaveBalance: { casual: 5, sick: 3, earned: 7 }
  },

  // Cafe Staff
  {
    id: 'STF-09',
    employeeId: 'STF-09',
    name: 'Kavita Nair',
    role: 'Café Manager',
    department: 'Café',
    serviceKey: 'cafe',
    phone: '+91 98210 44444',
    email: 'kavita@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    salary: '₹55,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 9, sick: 4, earned: 15 }
  },
  {
    id: 'STF-10',
    employeeId: 'STF-10',
    name: 'Chef Vikram Thapar',
    role: 'Café Manager',
    department: 'Café',
    serviceKey: 'cafe',
    phone: '+91 98210 44455',
    email: 'vikram.t@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    salary: '₹60,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 6, sick: 5, earned: 10 }
  },

  // Drive-Thru Staff
  {
    id: 'STF-11',
    employeeId: 'STF-11',
    name: 'Manish Sharma',
    role: 'Drive-Thru Lead',
    department: 'Drive-Through Café',
    serviceKey: 'drive-through-cafe',
    phone: '+91 98210 88888',
    email: 'manish.d@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    salary: '₹34,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 7, sick: 4, earned: 9 }
  },

  // Salon Staff
  {
    id: 'STF-12',
    employeeId: 'STF-12',
    name: 'Tahir Khan',
    role: 'Salon Master',
    department: 'Men\'s Salon',
    serviceKey: 'salon',
    phone: '+91 98210 77777',
    email: 'tahir@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    salary: '₹48,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 8, sick: 3, earned: 11 }
  },
  {
    id: 'STF-13',
    employeeId: 'STF-13',
    name: 'Sameer Merchant',
    role: 'Salon Master',
    department: 'Men\'s Salon',
    serviceKey: 'salon',
    phone: '+91 98210 77788',
    email: 'sameer.m@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    salary: '₹36,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 6, sick: 2, earned: 8 }
  },

  // Cashier Staff
  {
    id: 'STF-14',
    employeeId: 'STF-14',
    name: 'Neha Kapoor',
    role: 'Cashier',
    department: 'Operations',
    serviceKey: 'global',
    phone: '+91 98210 99999',
    email: 'neha.k@theshinelounge.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    salary: '₹30,000 / mo',
    status: 'On Shift',
    leaveBalance: { casual: 5, sick: 4, earned: 10 }
  }
];

// Initial 50+ Bookings Assigned to Staff
export const mockAssignedJobs = [
  // Car Wash Jobs
  {
    id: 'JOB-7001',
    customerId: 'CUST-001',
    customerName: 'Rahul Sharma',
    phone: '+91 98200 12345',
    serviceKey: 'car-wash',
    serviceName: 'Car Wash',
    planName: 'Single Wash',
    vehicleNo: 'MH01AB1234',
    vehicleModel: 'Tesla Model 3',
    staffId: 'STF-03',
    staffName: 'Rohan Deshmukh',
    date: '2026-07-20',
    timeSlot: '04:30 PM',
    amount: 699,
    gst: 125.82,
    total: 824.82,
    paymentMode: 'UPI',
    paymentStatus: 'Paid',
    status: 'Work Started',
    stepIndex: 2,
    notes: 'Customer requested special underbody foam jetting.',
    photos: [
      'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=400&q=80'
    ],
    createdAt: '2026-07-20 04:00 PM'
  },
  {
    id: 'JOB-7002',
    customerId: 'CUST-002',
    customerName: 'Aditya Roy',
    phone: '+91 98200 99887',
    serviceKey: 'car-wash',
    serviceName: 'Car Wash',
    planName: 'Monthly Pass',
    vehicleNo: 'MH04XY7788',
    vehicleModel: 'Fortuner Legender',
    staffId: 'STF-03',
    staffName: 'Rohan Deshmukh',
    date: '2026-07-20',
    timeSlot: '05:15 PM',
    amount: 2499,
    gst: 449.82,
    total: 2948.82,
    paymentMode: 'Membership Pass',
    paymentStatus: 'Paid',
    status: 'Vehicle Received',
    stepIndex: 1,
    notes: 'Monthly pass validation verified.',
    photos: [],
    createdAt: '2026-07-20 04:45 PM'
  },
  {
    id: 'JOB-7003',
    customerId: 'CUST-003',
    customerName: 'Vivek Oberoi',
    phone: '+91 98330 11223',
    serviceKey: 'car-wash',
    serviceName: 'Car Wash',
    planName: 'Single Wash',
    vehicleNo: 'MH02CD9988',
    vehicleModel: 'BMW 3 Series',
    staffId: 'STF-04',
    staffName: 'Vijay Shinde',
    date: '2026-07-20',
    timeSlot: '03:00 PM',
    amount: 699,
    gst: 125.82,
    total: 824.82,
    paymentMode: 'Card',
    paymentStatus: 'Paid',
    status: 'Completed',
    stepIndex: 4,
    notes: 'Cleaned alloy wheels with hydrophobic spray.',
    photos: [
      'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80'
    ],
    createdAt: '2026-07-20 02:30 PM'
  },

  // Car Detailing Jobs
  {
    id: 'JOB-7004',
    customerId: 'CUST-004',
    customerName: 'Priya Patel',
    phone: '+91 98331 56789',
    serviceKey: 'car-detailing',
    serviceName: 'Car Detailing',
    planName: 'Ceramic Shield 9H',
    vehicleNo: 'MH02CD5678',
    vehicleModel: 'BMW X5',
    staffId: 'STF-05',
    staffName: 'Deepak Joshi',
    date: '2026-07-20',
    timeSlot: '02:00 PM',
    amount: 14999,
    gst: 2699.82,
    total: 17698.82,
    paymentMode: 'Card',
    paymentStatus: 'Paid',
    status: 'Work in Progress',
    stepIndex: 4,
    notes: '2nd Layer Ceramic Coat application in progress in clean room.',
    photos: [
      'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80'
    ],
    createdAt: '2026-07-20 01:30 PM'
  },
  {
    id: 'JOB-7005',
    customerId: 'CUST-005',
    customerName: 'Karan Johar',
    phone: '+91 98199 44332',
    serviceKey: 'car-detailing',
    serviceName: 'Car Detailing',
    planName: 'Express Polish',
    vehicleNo: 'MH01KJ0001',
    vehicleModel: 'Mercedes S-Class',
    staffId: 'STF-06',
    staffName: 'Amit Saxena',
    date: '2026-07-20',
    timeSlot: '11:30 AM',
    amount: 1499,
    gst: 269.82,
    total: 1768.82,
    paymentMode: 'UPI',
    paymentStatus: 'Paid',
    status: 'Quality Check',
    stepIndex: 5,
    notes: 'Paint gloss gauge measured 94 GU.',
    photos: [],
    createdAt: '2026-07-20 11:00 AM'
  },

  // Dog Wash Jobs
  {
    id: 'JOB-7006',
    customerId: 'CUST-006',
    customerName: 'Manish Iyer',
    phone: '+91 98212 34567',
    serviceKey: 'dog-wash',
    serviceName: 'Dog Bath',
    planName: 'Full Dog Spa',
    vehicleNo: 'Golden Retriever (Bruno)',
    vehicleModel: 'Pet',
    staffId: 'STF-07',
    staffName: 'Sneha Rao',
    date: '2026-07-20',
    timeSlot: '05:30 PM',
    amount: 999,
    gst: 179.82,
    total: 1178.82,
    paymentMode: 'Cash',
    paymentStatus: 'Pending',
    status: 'Coat Blowout',
    stepIndex: 2,
    notes: 'Organic lavender coat blowout in progress.',
    photos: [
      'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=400&q=80'
    ],
    createdAt: '2026-07-20 05:00 PM'
  },

  // Cafe Jobs
  {
    id: 'JOB-7007',
    customerId: 'CUST-007',
    customerName: 'Aarti Singh',
    phone: '+91 98700 99887',
    serviceKey: 'cafe',
    serviceName: 'Café',
    planName: 'Brunch Special Combo',
    vehicleNo: 'Table 04',
    vehicleModel: 'Dine-In',
    staffId: 'STF-09',
    staffName: 'Kavita Nair',
    date: '2026-07-20',
    timeSlot: '11:00 AM',
    amount: 450,
    gst: 81.00,
    total: 531.00,
    paymentMode: 'UPI',
    paymentStatus: 'Paid',
    status: 'Kitchen Preparing',
    stepIndex: 2,
    notes: 'Extra oat milk in iced caramel latte.',
    photos: [],
    createdAt: '2026-07-20 10:45 AM'
  },

  // Salon Jobs
  {
    id: 'JOB-7008',
    customerId: 'CUST-008',
    customerName: 'Sanjay Dutt',
    phone: '+91 99300 44556',
    serviceKey: 'salon',
    serviceName: 'Men\'s Salon',
    planName: 'Executive Haircut & Beard',
    vehicleNo: 'Chair 02',
    vehicleModel: 'Salon',
    staffId: 'STF-12',
    staffName: 'Tahir Khan',
    date: '2026-07-20',
    timeSlot: '06:00 PM',
    amount: 898,
    gst: 161.64,
    total: 1059.64,
    paymentMode: 'Card',
    paymentStatus: 'Paid',
    status: 'Grooming in Progress',
    stepIndex: 2,
    notes: 'Hot towel charcoal facial included.',
    photos: [],
    createdAt: '2026-07-20 05:45 PM'
  }
];

// Initial Customers List
export const mockCustomers = [
  {
    id: 'CUST-001',
    name: 'Rahul Sharma',
    mobile: '+91 98200 12345',
    email: 'rahul.sharma@gmail.com',
    address: 'B-402, Seawoods Residency, Navi Mumbai',
    city: 'Mumbai',
    segment: 'Active Member',
    totalSpent: 38500,
    loyaltyPoints: 1250,
    joinDate: '2025-01-10',
    lastVisit: '2026-07-20',
    vehicles: [
      { id: 'V-1', registrationNumber: 'MH01AB1234', brand: 'Tesla', model: 'Model 3', color: 'White', fuelType: 'EV' }
    ]
  },
  {
    id: 'CUST-002',
    name: 'Priya Patel',
    mobile: '+91 98331 56789',
    email: 'priya.patel@yahoo.com',
    address: 'Villa 12, Hiranandani Estate, Thane',
    city: 'Thane',
    segment: 'High-Value VIP',
    totalSpent: 89000,
    loyaltyPoints: 3400,
    joinDate: '2024-08-15',
    lastVisit: '2026-07-20',
    vehicles: [
      { id: 'V-2', registrationNumber: 'MH02CD5678', brand: 'BMW', model: 'X5', color: 'Black Sapphire', fuelType: 'Diesel' }
    ]
  },
  {
    id: 'CUST-003',
    name: 'Vivek Oberoi',
    mobile: '+91 98330 11223',
    email: 'voberoi@gmail.com',
    address: 'Flat 101, Bandra West, Mumbai',
    city: 'Mumbai',
    segment: 'Regular Customer',
    totalSpent: 14200,
    loyaltyPoints: 420,
    joinDate: '2025-03-20',
    lastVisit: '2026-07-20',
    vehicles: [
      { id: 'V-3', registrationNumber: 'MH02CD9988', brand: 'BMW', model: '3 Series', color: 'Portimao Blue', fuelType: 'Petrol' }
    ]
  }
];

// Attendance Mock Records
export const mockAttendanceRecords = [
  {
    id: 'ATT-101',
    staffId: 'STF-03',
    date: '2026-07-20',
    checkInTime: '08:45 AM',
    checkOutTime: 'In Progress',
    status: 'Present',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    location: '19.0760° N, 72.8777° E (Thane Branch)'
  },
  {
    id: 'ATT-102',
    staffId: 'STF-05',
    date: '2026-07-20',
    checkInTime: '09:05 AM',
    checkOutTime: 'In Progress',
    status: 'Present',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    location: '19.0760° N, 72.8777° E (Thane Branch)'
  }
];

// Management Notifications
export const mockStaffNotifications = [
  {
    id: 'N-01',
    title: 'Monsoon Detailing Rush Alert!',
    message: 'High influx of ceramic coating bookings expected between 2 PM - 6 PM today.',
    type: 'alert',
    sentAt: 'Today, 10:00 AM',
    read: false
  },
  {
    id: 'N-02',
    title: 'Shift Timings Updated',
    message: 'Evening shift wrap-up meeting scheduled for 07:30 PM in the staff lounge.',
    type: 'info',
    sentAt: 'Yesterday, 04:15 PM',
    read: true
  }
];
