// Comprehensive Mock Data for "The Shine Lounge" Admin Panel
// Follows Indian Context: INR (₹), GST 18%, Indian Names, Vehicles (e.g. MH01AB1234), Indian Phones (+91)

export const initialDashboardStats = {
  totalRevenue: 4850000,
  revenueGrowth: 14.5,
  todaySales: 185000,
  todayGrowth: 8.2,
  monthlySales: 1420000,
  monthlyGrowth: 12.4,
  annualSales: 12000000,
  annualGrowth: 18.0,
  activeMembers: 1240,
  totalCustomers: 4850,
  pendingBookings: 18,
  lowStockItems: 6
};

// Per-Service Detailed Stats Mapping
export const serviceStatsMap = {
  'car-wash': {
    serviceKey: 'car-wash',
    serviceName: 'Car Wash',
    category: 'Automotive',
    tagline: 'High-pressure foam bath, underbody jet wash, and ceramic gloss polish',
    totalRevenue: 1650000,
    monthlySales: 480000,
    todaySales: 48500,
    activeBookings: 8,
    completedToday: 24,
    activeMembers: 640,
    satisfactionScore: 4.9,
    heroImage: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80',
    trendData: [
      { month: 'Jan', revenue: 280000, bookings: 350 },
      { month: 'Feb', revenue: 310000, bookings: 380 },
      { month: 'Mar', revenue: 340000, bookings: 410 },
      { month: 'Apr', revenue: 320000, bookings: 390 },
      { month: 'May', revenue: 390000, bookings: 460 },
      { month: 'Jun', revenue: 440000, bookings: 520 },
      { month: 'Jul', revenue: 480000, bookings: 560 }
    ]
  },
  'car-detailing': {
    serviceKey: 'car-detailing',
    serviceName: 'Car Detailing',
    category: 'Automotive',
    tagline: '9H Ceramic coating, multi-stage paint correction & steam sanitization',
    totalRevenue: 1420000,
    monthlySales: 410000,
    todaySales: 54000,
    activeBookings: 4,
    completedToday: 5,
    activeMembers: 210,
    satisfactionScore: 4.95,
    heroImage: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80',
    trendData: [
      { month: 'Jan', revenue: 240000, bookings: 30 },
      { month: 'Feb', revenue: 270000, bookings: 34 },
      { month: 'Mar', revenue: 310000, bookings: 40 },
      { month: 'Apr', revenue: 290000, bookings: 36 },
      { month: 'May', revenue: 350000, bookings: 45 },
      { month: 'Jun', revenue: 380000, bookings: 48 },
      { month: 'Jul', revenue: 410000, bookings: 52 }
    ]
  },
  'dog-wash': {
    serviceKey: 'dog-wash',
    serviceName: 'Dog Bath',
    category: 'Pet Care',
    tagline: 'Medicated fur bath, organic lavender spa, nail clipping & coat blowout',
    totalRevenue: 320000,
    monthlySales: 95000,
    todaySales: 12500,
    activeBookings: 3,
    completedToday: 12,
    activeMembers: 140,
    satisfactionScore: 4.88,
    heroImage: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80',
    trendData: [
      { month: 'Jan', revenue: 50000, bookings: 80 },
      { month: 'Feb', revenue: 58000, bookings: 92 },
      { month: 'Mar', revenue: 65000, bookings: 105 },
      { month: 'Apr', revenue: 62000, bookings: 98 },
      { month: 'May', revenue: 78000, bookings: 125 },
      { month: 'Jun', revenue: 85000, bookings: 135 },
      { month: 'Jul', revenue: 95000, bookings: 150 }
    ]
  },
  'cafe': {
    serviceKey: 'cafe',
    serviceName: 'Café',
    category: 'Food & Beverage',
    tagline: 'Artisanal single-origin brews, avocado sourdough toasts & gourmet brunches',
    totalRevenue: 680000,
    monthlySales: 195000,
    todaySales: 28500,
    activeBookings: 14,
    completedToday: 42,
    activeMembers: 320,
    satisfactionScore: 4.92,
    heroImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    trendData: [
      { month: 'Jan', revenue: 110000, bookings: 280 },
      { month: 'Feb', revenue: 125000, bookings: 310 },
      { month: 'Mar', revenue: 140000, bookings: 350 },
      { month: 'Apr', revenue: 135000, bookings: 340 },
      { month: 'May', revenue: 160000, bookings: 410 },
      { month: 'Jun', revenue: 175000, bookings: 440 },
      { month: 'Jul', revenue: 195000, bookings: 490 }
    ]
  },
  'drive-through-cafe': {
    serviceKey: 'drive-through-cafe',
    serviceName: 'Drive-Through Café',
    category: 'Food & Beverage',
    tagline: 'Fast 90-second commuter brews, nitro cold brews, breakfast wraps & snacks',
    totalRevenue: 520000,
    monthlySales: 155000,
    todaySales: 22000,
    activeBookings: 6,
    completedToday: 65,
    activeMembers: 280,
    satisfactionScore: 4.85,
    heroImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    trendData: [
      { month: 'Jan', revenue: 85000, bookings: 320 },
      { month: 'Feb', revenue: 98000, bookings: 360 },
      { month: 'Mar', revenue: 110000, bookings: 410 },
      { month: 'Apr', revenue: 105000, bookings: 390 },
      { month: 'May', revenue: 130000, bookings: 480 },
      { month: 'Jun', revenue: 142000, bookings: 530 },
      { month: 'Jul', revenue: 155000, bookings: 580 }
    ]
  },
  'salon': {
    serviceKey: 'salon',
    serviceName: 'Men\'s Salon',
    category: 'Grooming',
    tagline: 'Executive haircuts, hot-towel beard sculpting, head massage & charcoal facial',
    totalRevenue: 260000,
    monthlySales: 85000,
    todaySales: 11500,
    activeBookings: 2,
    completedToday: 14,
    activeMembers: 190,
    satisfactionScore: 4.91,
    heroImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    trendData: [
      { month: 'Jan', revenue: 42000, bookings: 75 },
      { month: 'Feb', revenue: 49000, bookings: 88 },
      { month: 'Mar', revenue: 56000, bookings: 100 },
      { month: 'Apr', revenue: 53000, bookings: 95 },
      { month: 'May', revenue: 68000, bookings: 120 },
      { month: 'Jun', revenue: 75000, bookings: 135 },
      { month: 'Jul', revenue: 85000, bookings: 150 }
    ]
  }
};

// 12-Month Global Revenue Trend
export const revenueTrendData = [
  { month: 'Jan', revenue: 850000, bookings: 420 },
  { month: 'Feb', revenue: 920000, bookings: 460 },
  { month: 'Mar', revenue: 1050000, bookings: 510 },
  { month: 'Apr', revenue: 980000, bookings: 490 },
  { month: 'May', revenue: 1120000, bookings: 550 },
  { month: 'Jun', revenue: 1250000, bookings: 610 },
  { month: 'Jul', revenue: 1180000, bookings: 590 },
  { month: 'Aug', revenue: 1310000, bookings: 640 },
  { month: 'Sep', revenue: 1280000, bookings: 630 },
  { month: 'Oct', revenue: 1450000, bookings: 710 },
  { month: 'Nov', revenue: 1520000, bookings: 750 },
  { month: 'Dec', revenue: 1680000, bookings: 820 }
];

// Service-wise Revenue Distribution
export const serviceRevenueData = [
  { name: 'Car Wash', value: 1650000, color: '#e07b2a' },
  { name: 'Car Detailing', value: 1420000, color: '#1e4a7e' },
  { name: 'Café', value: 680000, color: '#f59e0b' },
  { name: 'Drive-Through Café', value: 520000, color: '#3b82f6' },
  { name: 'Dog Bath', value: 320000, color: '#10b981' },
  { name: 'Men\'s Salon', value: 260000, color: '#8b5cf6' }
];

// Payment Mode Distribution
export const paymentModeData = [
  { mode: 'UPI / QR', amount: 2450000, count: 2150 },
  { mode: 'Credit/Debit Card', amount: 1350000, count: 980 },
  { mode: 'Membership Pass', amount: 750000, count: 620 },
  { mode: 'Cash', amount: 300000, count: 410 }
];

// Initial 6 Services with Sub-services / Pricing Plans
export const initialServices = [
  {
    id: 'srv-1',
    key: 'car-wash',
    name: 'Car Wash',
    category: 'Automotive',
    description: 'High-pressure wash, foam bath, underbody spray, and towel dry.',
    price: 699,
    duration: '30 min',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=600&q=80',
    plans: [
      { id: 'p1', name: 'Single Wash', price: 699, description: 'Complimentary vacuum, polish, matt cleaning', billing: 'per wash' },
      { id: 'p2', name: 'Monthly Membership', price: 2499, description: '1-3 times car fragrance, 4 washes included', billing: 'per month' },
      { id: 'p3', name: 'Annual VIP Pass', price: 24999, description: 'Unlimited washes + 2 detailing sessions', billing: 'per year' }
    ]
  },
  {
    id: 'srv-2',
    key: 'car-detailing',
    name: 'Car Detailing',
    category: 'Automotive',
    description: 'Ceramic coating, paint correction, interior deep shampoo, engine bay baying.',
    price: 3499,
    duration: '180 min',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80',
    plans: [
      { id: 'p4', name: 'Express Polish', price: 1499, description: 'Single stage machine polish', billing: 'per service' },
      { id: 'p5', name: 'Ceramic Shield 9H', price: 14999, description: '3 Year warranty ceramic coating', billing: 'per service' },
      { id: 'p6', name: 'Interior Sanitization', price: 2499, description: 'Ozone treatment + steam clean', billing: 'per service' }
    ]
  },
  {
    id: 'srv-3',
    key: 'dog-wash',
    name: 'Dog Bath',
    category: 'Pet Care',
    description: 'Medicated bath, blow dry, nail clipping, ear cleaning, and coat brushing.',
    price: 499,
    duration: '45 min',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80',
    plans: [
      { id: 'p7', name: 'Basic Paw Bath', price: 499, description: 'Shampoo bath + blow dry', billing: 'per pet' },
      { id: 'p8', name: 'Full Dog Spa', price: 999, description: 'Bath, haircut, nail trim, ear spa', billing: 'per pet' }
    ]
  },
  {
    id: 'srv-4',
    key: 'cafe',
    name: 'Café',
    category: 'Food & Beverage',
    description: 'Gourmet artisanal coffee, sourdough toasts, fresh pastries, and brunch plates.',
    price: 350,
    duration: '15 min',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    plans: [
      { id: 'p9', name: 'Brunch Special Combo', price: 450, description: 'Poached Egg Toast + Double Latte', billing: 'per item' },
      { id: 'p10', name: 'Coffee Pass Monthly', price: 1999, description: '1 Daily artisan coffee', billing: 'per month' }
    ]
  },
  {
    id: 'srv-5',
    key: 'drive-through-cafe',
    name: 'Drive-Through Café',
    category: 'Food & Beverage',
    description: 'Fast 90s cup-holder ready coffees, burgers, cold brews, and snacks.',
    price: 250,
    duration: '5 min',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    plans: [
      { id: 'p11', name: 'Express Cold Brew', price: 190, description: '16oz Single origin cold brew', billing: 'per item' },
      { id: 'p12', name: 'Commuter Combo', price: 299, description: 'Cold Brew + Breakfast Wrap', billing: 'per item' }
    ]
  },
  {
    id: 'srv-6',
    key: 'salon',
    name: 'Men\'s Salon',
    category: 'Grooming',
    description: 'Executive haircuts, beard sculpting, head massage, and facial care.',
    price: 599,
    duration: '40 min',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    plans: [
      { id: 'p13', name: 'Executive Haircut', price: 499, description: 'Wash + Style + Haircut', billing: 'per session' },
      { id: 'p14', name: 'Royal Beard Spa', price: 399, description: 'Hot towel + Beard sculpture + Oil', billing: 'per session' }
    ]
  }
];

// Initial Banners for ALL 6 Services
export const initialBanners = [
  // Car Wash
  {
    id: 'ban-1',
    serviceKey: 'car-wash',
    title: 'DELUXE CAR WASH OFFER',
    subtitle: 'Save 20% on all detailing and executive polish packages this week.',
    badge: 'Wash Special',
    link: '/car-wash',
    imageUrl: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    order: 1
  },
  {
    id: 'ban-2',
    serviceKey: 'car-wash',
    title: 'MONSOON UNDERBODY JET SPRAY',
    subtitle: 'Free anti-rust chassis coating with any monthly car wash pass renewal.',
    badge: 'Monsoon Deal',
    link: '/car-wash',
    imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    order: 2
  },
  // Car Detailing
  {
    id: 'ban-3',
    serviceKey: 'car-detailing',
    title: 'CERAMIC 9H SHIELD SPECIAL',
    subtitle: 'Free interior ozone sanitization session with 9H Ceramic coating package.',
    badge: 'Detailing Offer',
    link: '/car-detailing',
    imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    order: 3
  },
  // Dog Wash
  {
    id: 'ban-4',
    serviceKey: 'dog-wash',
    title: 'PAMPER YOUR PET SPA',
    subtitle: 'Free organic lavender paw balm with every Full Dog Spa package booked.',
    badge: 'Pet Spa Deal',
    link: '/dog-wash',
    imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    order: 4
  },
  // Cafe
  {
    id: 'ban-5',
    serviceKey: 'cafe',
    title: 'BREAKFAST & ARTISANAL BRUNCH',
    subtitle: 'Get 30% off on freshly baked sourdough toasts and morning double lattes.',
    badge: 'Brunch Special',
    link: '/cafe',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    order: 5
  },
  // Drive-Thru Cafe
  {
    id: 'ban-6',
    serviceKey: 'drive-through-cafe',
    title: '90-SECOND EXPRESS COMMUTER',
    subtitle: 'Single-origin cold brew + fresh wrap ready in under 90 seconds.',
    badge: 'Express Pass',
    link: '/drive-through-cafe',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    order: 6
  },
  // Salon
  {
    id: 'ban-7',
    serviceKey: 'salon',
    title: 'ROYAL BEARD & HAIR SPA',
    subtitle: 'Hot towel head massage + executive hair styling combo offer.',
    badge: 'Grooming Special',
    link: '/salon',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    order: 7
  }
];

// Initial Memberships
export const initialMemberships = [
  {
    id: 'MEM-1001',
    customerName: 'Rahul Sharma',
    phone: '+91 98200 12345',
    email: 'rahul.sharma@gmail.com',
    vehicleNo: 'MH01AB1234',
    vehicleModel: 'Tesla Model 3',
    planName: 'Monthly Membership',
    serviceKey: 'car-wash',
    type: 'Monthly',
    startDate: '2026-06-01',
    expiryDate: '2026-07-31',
    washesUsed: 3,
    maxWashes: 4,
    status: 'Active',
    amount: 2499
  },
  {
    id: 'MEM-1002',
    customerName: 'Priya Patel',
    phone: '+91 98331 56789',
    email: 'priya.patel@yahoo.com',
    vehicleNo: 'MH02CD5678',
    vehicleModel: 'BMW X5',
    planName: 'Annual VIP Pass',
    serviceKey: 'car-detailing',
    type: 'Annual',
    startDate: '2025-08-15',
    expiryDate: '2026-08-14',
    washesUsed: 18,
    maxWashes: 48,
    status: 'Active',
    amount: 24999
  },
  {
    id: 'MEM-1003',
    customerName: 'Vikram Mehta',
    phone: '+91 97690 43210',
    email: 'vmehta@outlook.com',
    vehicleNo: 'MH04EF9012',
    vehicleModel: 'Audi Q7',
    planName: 'Monthly Membership',
    serviceKey: 'car-wash',
    type: 'Monthly',
    startDate: '2026-05-10',
    expiryDate: '2026-06-10',
    washesUsed: 4,
    maxWashes: 4,
    status: 'Expired',
    amount: 2499
  },
  {
    id: 'MEM-1004',
    customerName: 'Ananya Roy',
    phone: '+91 98199 87654',
    email: 'ananya.roy@hotmail.com',
    vehicleNo: 'MH03GH3456',
    vehicleModel: 'Mercedes C-Class',
    planName: 'Coffee Pass Monthly',
    serviceKey: 'cafe',
    type: 'Monthly',
    startDate: '2026-06-25',
    expiryDate: '2026-07-25',
    washesUsed: 15,
    maxWashes: 30,
    status: 'Expiring Soon',
    amount: 1999
  }
];

// Initial Staff Members for ALL 6 Services
export const initialStaff = [
  {
    id: 'STF-01',
    name: 'Amitabh Verma',
    role: 'Super Admin',
    department: 'Management',
    serviceKey: 'global',
    phone: '+91 98210 11111',
    email: 'amitabh@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-01-15',
    salary: '₹1,20,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  // Car Wash Staff
  {
    id: 'STF-02',
    name: 'Rohan Deshmukh',
    role: 'Car Wash Supervisor',
    department: 'Car Wash',
    serviceKey: 'car-wash',
    phone: '+91 98210 33333',
    email: 'rohan@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-05-10',
    salary: '₹35,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'STF-03',
    name: 'Vijay Shinde',
    role: 'High-Pressure Spray Technician',
    department: 'Car Wash',
    serviceKey: 'car-wash',
    phone: '+91 98210 33344',
    email: 'vijay@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-06-01',
    salary: '₹28,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  // Car Detailing Staff
  {
    id: 'STF-04',
    name: 'Deepak Joshi',
    role: 'Master Detailing Specialist',
    department: 'Car Detailing',
    serviceKey: 'car-detailing',
    phone: '+91 98210 55555',
    email: 'deepak@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-07-20',
    salary: '₹48,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'STF-05',
    name: 'Amit Saxena',
    role: 'Paint Correction Artist',
    department: 'Car Detailing',
    serviceKey: 'car-detailing',
    phone: '+91 98210 55566',
    email: 'amit.s@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-08-15',
    salary: '₹42,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80'
  },
  // Dog Wash Staff
  {
    id: 'STF-06',
    name: 'Sneha Rao',
    role: 'Lead Pet Groomer',
    department: 'Dog Wash',
    serviceKey: 'dog-wash',
    phone: '+91 98210 66666',
    email: 'sneha@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-09-01',
    salary: '₹38,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'STF-07',
    name: 'Pooja Kulkarni',
    role: 'Pet Spa Assistant',
    department: 'Dog Wash',
    serviceKey: 'dog-wash',
    phone: '+91 98210 66677',
    email: 'pooja.k@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-10-10',
    salary: '₹26,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
  },
  // Cafe Staff
  {
    id: 'STF-08',
    name: 'Kavita Nair',
    role: 'Head Café Manager',
    department: 'Café',
    serviceKey: 'cafe',
    phone: '+91 98210 44444',
    email: 'kavita@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-06-12',
    salary: '₹55,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'STF-09',
    name: 'Chef Vikram Thapar',
    role: 'Executive Pastry Chef',
    department: 'Café',
    serviceKey: 'cafe',
    phone: '+91 98210 44455',
    email: 'vikram.t@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-07-01',
    salary: '₹60,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  // Drive-Thru Staff
  {
    id: 'STF-10',
    name: 'Manish Sharma',
    role: 'Drive-Thru Express Lead',
    department: 'Drive-Through Café',
    serviceKey: 'drive-through-cafe',
    phone: '+91 98210 88888',
    email: 'manish.d@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-11-01',
    salary: '₹34,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
  },
  // Salon Staff
  {
    id: 'STF-11',
    name: 'Tahir Khan',
    role: 'Executive Salon Master',
    department: 'Men\'s Salon',
    serviceKey: 'salon',
    phone: '+91 98210 77777',
    email: 'tahir@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-10-15',
    salary: '₹48,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'STF-12',
    name: 'Sameer Merchant',
    role: 'Beard Sculpting Specialist',
    department: 'Men\'s Salon',
    serviceKey: 'salon',
    phone: '+91 98210 77788',
    email: 'sameer.m@theshinelounge.com',
    status: 'Active',
    joinedDate: '2024-11-10',
    salary: '₹36,000 / mo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  }
];

// Initial Bookings for ALL 6 Services
export const initialBookings = [
  // Car Wash Bookings
  {
    id: 'BK-9001',
    customerName: 'Rahul Sharma',
    phone: '+91 98200 12345',
    serviceKey: 'car-wash',
    service: 'Car Wash',
    plan: 'Single Wash',
    amount: 699,
    gst: 125.82,
    total: 824.82,
    date: '2026-07-20',
    timeSlot: '04:30 PM',
    status: 'Completed',
    staffAssigned: 'Rohan Deshmukh',
    paymentMode: 'UPI',
    vehicleNo: 'MH01AB1234'
  },
  {
    id: 'BK-9002',
    customerName: 'Aditya Roy',
    phone: '+91 98200 99887',
    serviceKey: 'car-wash',
    service: 'Car Wash',
    plan: 'Monthly Membership',
    amount: 2499,
    gst: 449.82,
    total: 2948.82,
    date: '2026-07-20',
    timeSlot: '03:00 PM',
    status: 'In Progress',
    staffAssigned: 'Vijay Shinde',
    paymentMode: 'Card',
    vehicleNo: 'MH04XY7788'
  },
  // Car Detailing Bookings
  {
    id: 'BK-9003',
    customerName: 'Priya Patel',
    phone: '+91 98331 56789',
    serviceKey: 'car-detailing',
    service: 'Car Detailing',
    plan: 'Ceramic Shield 9H',
    amount: 14999,
    gst: 2699.82,
    total: 17698.82,
    date: '2026-07-20',
    timeSlot: '02:00 PM',
    status: 'In Progress',
    staffAssigned: 'Deepak Joshi',
    paymentMode: 'Card',
    vehicleNo: 'MH02CD5678'
  },
  {
    id: 'BK-9004',
    customerName: 'Karan Johar',
    phone: '+91 98199 44332',
    serviceKey: 'car-detailing',
    service: 'Car Detailing',
    plan: 'Express Polish',
    amount: 1499,
    gst: 269.82,
    total: 1768.82,
    date: '2026-07-20',
    timeSlot: '11:30 AM',
    status: 'Completed',
    staffAssigned: 'Amit Saxena',
    paymentMode: 'UPI',
    vehicleNo: 'MH01KJ0001'
  },
  // Dog Wash Bookings
  {
    id: 'BK-9005',
    customerName: 'Manish Iyer',
    phone: '+91 98212 34567',
    serviceKey: 'dog-wash',
    service: 'Dog Bath',
    plan: 'Full Dog Spa',
    amount: 999,
    gst: 179.82,
    total: 1178.82,
    date: '2026-07-20',
    timeSlot: '05:30 PM',
    status: 'Pending',
    staffAssigned: 'Sneha Rao',
    paymentMode: 'Cash',
    vehicleNo: 'N/A'
  },
  {
    id: 'BK-9006',
    customerName: 'Ananya Panday',
    phone: '+91 98200 55443',
    serviceKey: 'dog-wash',
    service: 'Dog Bath',
    plan: 'Basic Paw Bath',
    amount: 499,
    gst: 89.82,
    total: 588.82,
    date: '2026-07-20',
    timeSlot: '01:15 PM',
    status: 'Completed',
    staffAssigned: 'Pooja Kulkarni',
    paymentMode: 'UPI',
    vehicleNo: 'N/A'
  },
  // Cafe Bookings
  {
    id: 'BK-9007',
    customerName: 'Aarti Singh',
    phone: '+91 98700 99887',
    serviceKey: 'cafe',
    service: 'Café',
    plan: 'Brunch Special Combo',
    amount: 450,
    gst: 81.00,
    total: 531.00,
    date: '2026-07-20',
    timeSlot: '11:00 AM',
    status: 'Completed',
    staffAssigned: 'Kavita Nair',
    paymentMode: 'UPI',
    vehicleNo: 'N/A'
  },
  {
    id: 'BK-9008',
    customerName: 'Ranveer Singh',
    phone: '+91 99200 11223',
    serviceKey: 'cafe',
    service: 'Café',
    plan: 'Coffee Pass Monthly',
    amount: 1999,
    gst: 359.82,
    total: 2358.82,
    date: '2026-07-20',
    timeSlot: '09:00 AM',
    status: 'Completed',
    staffAssigned: 'Chef Vikram Thapar',
    paymentMode: 'Card',
    vehicleNo: 'MH02RS8888'
  },
  // Drive-Thru Cafe Bookings
  {
    id: 'BK-9009',
    customerName: 'Divya Agarwal',
    phone: '+91 98190 77889',
    serviceKey: 'drive-through-cafe',
    service: 'Drive-Through Café',
    plan: 'Commuter Combo',
    amount: 299,
    gst: 53.82,
    total: 352.82,
    date: '2026-07-20',
    timeSlot: '08:15 AM',
    status: 'Completed',
    staffAssigned: 'Manish Sharma',
    paymentMode: 'UPI',
    vehicleNo: 'MH05XY9999'
  },
  {
    id: 'BK-9010',
    customerName: 'Varun Dhawan',
    phone: '+91 98200 66778',
    serviceKey: 'drive-through-cafe',
    service: 'Drive-Through Café',
    plan: 'Express Cold Brew',
    amount: 190,
    gst: 34.20,
    total: 224.20,
    date: '2026-07-20',
    timeSlot: '08:45 AM',
    status: 'Completed',
    staffAssigned: 'Manish Sharma',
    paymentMode: 'UPI',
    vehicleNo: 'MH01VD1000'
  },
  // Salon Bookings
  {
    id: 'BK-9011',
    customerName: 'Sanjay Dutt',
    phone: '+91 99300 44556',
    serviceKey: 'salon',
    service: 'Men\'s Salon',
    plan: 'Executive Haircut',
    amount: 499,
    gst: 89.82,
    total: 588.82,
    date: '2026-07-20',
    timeSlot: '06:00 PM',
    status: 'Confirmed',
    staffAssigned: 'Tahir Khan',
    paymentMode: 'Card',
    vehicleNo: 'N/A'
  },
  {
    id: 'BK-9012',
    customerName: 'Ayushmann Khurrana',
    phone: '+91 98200 33221',
    serviceKey: 'salon',
    service: 'Men\'s Salon',
    plan: 'Royal Beard Spa',
    amount: 399,
    gst: 71.82,
    total: 470.82,
    date: '2026-07-20',
    timeSlot: '04:00 PM',
    status: 'Completed',
    staffAssigned: 'Sameer Merchant',
    paymentMode: 'UPI',
    vehicleNo: 'N/A'
  }
];

// Initial Customer Database
export const initialCustomers = [
  {
    id: 'CUST-001',
    name: 'Rahul Sharma',
    phone: '+91 98200 12345',
    email: 'rahul.sharma@gmail.com',
    city: 'Mumbai',
    segment: 'Active Member',
    totalSpent: 38500,
    loyaltyPoints: 1250,
    vehicles: ['MH01AB1234 (Tesla Model 3)'],
    lastVisit: '2026-07-20',
    totalBookings: 24
  },
  {
    id: 'CUST-002',
    name: 'Priya Patel',
    phone: '+91 98331 56789',
    email: 'priya.patel@yahoo.com',
    city: 'Mumbai',
    segment: 'High-Value VIP',
    totalSpent: 89000,
    loyaltyPoints: 3400,
    vehicles: ['MH02CD5678 (BMW X5)'],
    lastVisit: '2026-07-20',
    totalBookings: 18
  },
  {
    id: 'CUST-003',
    name: 'Vikram Mehta',
    phone: '+91 97690 43210',
    email: 'vmehta@outlook.com',
    city: 'Thane',
    segment: 'Expired Member',
    totalSpent: 18200,
    loyaltyPoints: 620,
    vehicles: ['MH04EF9012 (Audi Q7)'],
    lastVisit: '2026-06-10',
    totalBookings: 10
  }
];

// Initial Inventory Items for ALL 6 Services
export const initialInventory = [
  // Car Wash Inventory
  {
    id: 'INV-101',
    name: 'Snow Foam Car Shampoo (20L)',
    serviceKey: 'car-wash',
    department: 'Car Wash',
    category: 'Chemicals',
    supplier: 'ChemicalGuys India',
    purchasePrice: 2800,
    sellingPrice: 0,
    currentStock: 4,
    minStock: 8,
    unit: 'Cans',
    status: 'Low Stock'
  },
  {
    id: 'INV-102',
    name: 'Microfiber Drying Towels (800 GSM)',
    serviceKey: 'car-wash',
    department: 'Car Wash',
    category: 'Tools',
    supplier: '3M Car Care',
    purchasePrice: 250,
    sellingPrice: 0,
    currentStock: 45,
    minStock: 15,
    unit: 'Pieces',
    status: 'In Stock'
  },
  {
    id: 'INV-103',
    name: 'Underbody Pressure Spray Nozzles',
    serviceKey: 'car-wash',
    department: 'Car Wash',
    category: 'Hardware',
    supplier: 'Karcher Pro',
    purchasePrice: 1500,
    sellingPrice: 0,
    currentStock: 8,
    minStock: 4,
    unit: 'Units',
    status: 'In Stock'
  },
  {
    id: 'INV-104',
    name: 'Hydrophobic Polish Wax (5L)',
    serviceKey: 'car-wash',
    department: 'Car Wash',
    category: 'Chemicals',
    supplier: 'Meguiars India',
    purchasePrice: 3500,
    sellingPrice: 0,
    currentStock: 6,
    minStock: 3,
    unit: 'Cans',
    status: 'In Stock'
  },

  // Car Detailing Inventory
  {
    id: 'INV-201',
    name: 'Ceramic Coating Shield 9H (50ml)',
    serviceKey: 'car-detailing',
    department: 'Car Detailing',
    category: 'Coatings',
    supplier: 'Gtechniq India',
    purchasePrice: 4200,
    sellingPrice: 14999,
    currentStock: 12,
    minStock: 5,
    unit: 'Bottles',
    status: 'In Stock'
  },
  {
    id: 'INV-202',
    name: 'Dual Action Polishing Foam Pads',
    serviceKey: 'car-detailing',
    department: 'Car Detailing',
    category: 'Tools',
    supplier: 'Rupes Bigfoot',
    purchasePrice: 650,
    sellingPrice: 0,
    currentStock: 24,
    minStock: 10,
    unit: 'Pads',
    status: 'In Stock'
  },
  {
    id: 'INV-203',
    name: 'Ozone Sanitizer Machine Cartridge',
    serviceKey: 'car-detailing',
    department: 'Car Detailing',
    category: 'Equipment',
    supplier: 'AirPro Tech',
    purchasePrice: 2200,
    sellingPrice: 0,
    currentStock: 2,
    minStock: 5,
    unit: 'Units',
    status: 'Low Stock'
  },

  // Dog Wash Inventory
  {
    id: 'INV-301',
    name: 'Organic Pet Shampoo Lavender (5L)',
    serviceKey: 'dog-wash',
    department: 'Dog Wash',
    category: 'Pet Grooming',
    supplier: 'Bark&Lather Co.',
    purchasePrice: 1800,
    sellingPrice: 0,
    currentStock: 9,
    minStock: 3,
    unit: 'Bottles',
    status: 'In Stock'
  },
  {
    id: 'INV-302',
    name: 'Paw Balm & Deodorant Spray',
    serviceKey: 'dog-wash',
    department: 'Dog Wash',
    category: 'Pet Grooming',
    supplier: 'PetCare Pro',
    purchasePrice: 450,
    sellingPrice: 899,
    currentStock: 18,
    minStock: 6,
    unit: 'Bottles',
    status: 'In Stock'
  },

  // Cafe Inventory
  {
    id: 'INV-401',
    name: 'Single Origin Arabica Beans (1kg)',
    serviceKey: 'cafe',
    department: 'Café',
    category: 'Beverage Ingredients',
    supplier: 'Blue Tokai Roasters',
    purchasePrice: 1100,
    sellingPrice: 0,
    currentStock: 3,
    minStock: 10,
    unit: 'Bags',
    status: 'Low Stock'
  },
  {
    id: 'INV-402',
    name: 'Organic Oat Milk Carton (1L)',
    serviceKey: 'cafe',
    department: 'Café',
    category: 'Beverage Ingredients',
    supplier: 'Oatly India',
    purchasePrice: 280,
    sellingPrice: 0,
    currentStock: 30,
    minStock: 12,
    unit: 'Packets',
    status: 'In Stock'
  },

  // Drive-Thru Cafe Inventory
  {
    id: 'INV-501',
    name: 'Nitro Cold Brew Keg (20L)',
    serviceKey: 'drive-through-cafe',
    department: 'Drive-Through Café',
    category: 'Beverage Ingredients',
    supplier: 'Blue Tokai Roasters',
    purchasePrice: 3200,
    sellingPrice: 0,
    currentStock: 5,
    minStock: 2,
    unit: 'Kegs',
    status: 'In Stock'
  },
  {
    id: 'INV-502',
    name: 'Insulated Car Cup Holders & Lids',
    serviceKey: 'drive-through-cafe',
    department: 'Drive-Through Café',
    category: 'Packaging',
    supplier: 'PackPro Mumbai',
    purchasePrice: 8,
    sellingPrice: 0,
    currentStock: 450,
    minStock: 100,
    unit: 'Pieces',
    status: 'In Stock'
  },

  // Salon Inventory
  {
    id: 'INV-601',
    name: 'Professional Hair Styling Clay (100g)',
    serviceKey: 'salon',
    department: 'Men\'s Salon',
    category: 'Grooming Products',
    supplier: 'Schwarzkopf Pro',
    purchasePrice: 650,
    sellingPrice: 1200,
    currentStock: 25,
    minStock: 10,
    unit: 'Tubs',
    status: 'In Stock'
  },
  {
    id: 'INV-602',
    name: 'Royal Beard Elixir Oil (50ml)',
    serviceKey: 'salon',
    department: 'Men\'s Salon',
    category: 'Grooming Products',
    supplier: 'Beardo Pro',
    purchasePrice: 380,
    sellingPrice: 799,
    currentStock: 15,
    minStock: 5,
    unit: 'Bottles',
    status: 'In Stock'
  }
];

// Initial Coupons
export const initialCoupons = [
  {
    id: 'CPN-01',
    code: 'SHINE50',
    title: '50% Off First Car Wash',
    discountType: 'Percentage',
    discountValue: 50,
    minPurchase: 699,
    maxDiscount: 350,
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    eligibleServices: 'Car Wash',
    usageLimit: 500,
    usedCount: 142,
    status: 'Active'
  },
  {
    id: 'CPN-02',
    code: 'CAFE100',
    title: 'Flat ₹100 Off Gourmet Brunch',
    discountType: 'Fixed Amount',
    discountValue: 100,
    minPurchase: 400,
    maxDiscount: 100,
    startDate: '2026-07-10',
    endDate: '2026-07-31',
    eligibleServices: 'Café, Drive-Through Café',
    usageLimit: 300,
    usedCount: 98,
    status: 'Active'
  }
];

// Initial Notifications
export const initialNotifications = [
  {
    id: 'NOTIF-01',
    title: 'Monsoon Car Spa Offer Announced!',
    message: 'Get 20% off on all underbody rust coating and hydrophobic glass treatment.',
    target: 'All Customers',
    channel: 'Push, WhatsApp',
    sentAt: '2026-07-18 10:30 AM',
    readRate: '84%',
    status: 'Sent'
  }
];
