// Comprehensive Mock Data for "The Shine Lounge" Admin Panel
// Follows Indian Context: INR (₹), GST 18%, Indian Names, Vehicles (e.g. MH01AB1234), Indian Phones (+91)

export const initialDashboardStats = {
  totalRevenue: 0,
  revenueGrowth: 0,
  todaySales: 0,
  todayGrowth: 0,
  monthlySales: 0,
  monthlyGrowth: 0,
  annualSales: 0,
  annualGrowth: 0,
  activeMembers: 0,
  totalCustomers: 0,
  pendingBookings: 0,
  lowStockItems: 0
};

// Per-Service Detailed Stats Mapping (clean defaults)
export const serviceStatsMap = {
  'car-wash': {
    serviceKey: 'car-wash',
    serviceName: 'Car Wash',
    category: 'Automotive',
    tagline: 'High-pressure foam bath, underbody jet wash, and ceramic gloss polish',
    totalRevenue: 0,
    monthlySales: 0,
    todaySales: 0,
    activeBookings: 0,
    completedToday: 0,
    activeMembers: 0,
    satisfactionScore: 5.0,
    heroImage: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80',
    trendData: []
  },
  'car-detailing': {
    serviceKey: 'car-detailing',
    serviceName: 'Car Detailing',
    category: 'Automotive',
    tagline: '9H Ceramic coating, multi-stage paint correction & steam sanitization',
    totalRevenue: 0,
    monthlySales: 0,
    todaySales: 0,
    activeBookings: 0,
    completedToday: 0,
    activeMembers: 0,
    satisfactionScore: 5.0,
    heroImage: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80',
    trendData: []
  },
  'dog-wash': {
    serviceKey: 'dog-wash',
    serviceName: 'Dog Bath',
    category: 'Pet Care',
    tagline: 'Medicated fur bath, organic lavender spa, nail clipping & coat blowout',
    totalRevenue: 0,
    monthlySales: 0,
    todaySales: 0,
    activeBookings: 0,
    completedToday: 0,
    activeMembers: 0,
    satisfactionScore: 5.0,
    heroImage: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80',
    trendData: []
  },
  'cafe': {
    serviceKey: 'cafe',
    serviceName: 'Café',
    category: 'Food & Beverage',
    tagline: 'Artisanal single-origin brews, avocado sourdough toasts & gourmet brunches',
    totalRevenue: 0,
    monthlySales: 0,
    todaySales: 0,
    activeBookings: 0,
    completedToday: 0,
    activeMembers: 0,
    satisfactionScore: 5.0,
    heroImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    trendData: []
  },
  'drive-through-cafe': {
    serviceKey: 'drive-through-cafe',
    serviceName: 'Drive-Through Café',
    category: 'Food & Beverage',
    tagline: 'Fast 90-second commuter brews, nitro cold brews, breakfast wraps & snacks',
    totalRevenue: 0,
    monthlySales: 0,
    todaySales: 0,
    activeBookings: 0,
    completedToday: 0,
    activeMembers: 0,
    satisfactionScore: 5.0,
    heroImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    trendData: []
  },
  'salon': {
    serviceKey: 'salon',
    serviceName: 'Men\'s Salon',
    category: 'Grooming',
    tagline: 'Executive haircuts, hot-towel beard sculpting, head massage & charcoal facial',
    totalRevenue: 0,
    monthlySales: 0,
    todaySales: 0,
    activeBookings: 0,
    completedToday: 0,
    activeMembers: 0,
    satisfactionScore: 5.0,
    heroImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    trendData: []
  }
};

// 12-Month Global Revenue Trend (empty by default)
export const revenueTrendData = [];

// Service-wise Revenue Distribution (empty by default)
export const serviceRevenueData = [];

// Payment Mode Distribution (empty by default)
export const paymentModeData = [];


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
      { id: 'pw-1', name: 'Single Wash', price: 699, description: 'Complimentary – vacuum, polish, mat cleaning', billing: 'per wash' }
    ],
    pricing: [
      { _id: 'pw-1', title: 'Single Wash', price: 699, description: 'Complimentary – vacuum, polish, mat cleaning' }
    ],
    memberships: [
      { _id: 'cw-mem-1', name: 'Monthly Membership', price: 2499, duration: 30, visitLimit: 50, benefits: ['50 washes/month + interior car fragrance'], badge: 'PASS' },
      { _id: 'cw-mem-2', name: 'Yearly Membership', price: 19999, duration: 365, visitLimit: 365, benefits: ['Unlimited washes + ceramic coating & 5x car fragrance'], badge: 'BEST VALUE' }
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
    name: 'Dog Wash',
    category: 'Pet Care',
    description: 'Self-serve & full-service hydrobath pet grooming lounge.',
    price: 100,
    duration: '2-12 min',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80',
    pricing: [
      { id: 'p7', title: '2 Minutes Wash', price: 100, description: 'Quick 2 minutes warm hydrobath session' },
      { id: 'p8', title: '5 Minutes Wash', price: 200, description: 'Standard 5 minutes warm hydrobath session' },
      { id: 'p9', title: '12 Minutes Wash', price: 500, description: 'Extended 12 minutes deluxe warm hydrobath session' }
    ],
    plans: [
      { id: 'p7', name: '2 Minutes Wash', price: 100, description: 'Quick 2 minutes warm hydrobath session', billing: 'per wash' },
      { id: 'p8', name: '5 Minutes Wash', price: 200, description: 'Standard 5 minutes warm hydrobath session', billing: 'per wash' },
      { id: 'p9', name: '12 Minutes Wash', price: 500, description: 'Extended 12 minutes deluxe warm hydrobath session', billing: 'per wash' }
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

// Initial Memberships across services (empty by default - loads from backend API)
export const initialMemberships = [];

// Initial Staff Members across services (empty by default - loads from backend API)
export const initialStaff = [];

// Initial Bookings across services (empty by default - loads from backend API)
export const initialBookings = [];

// Initial Customers (empty by default - loads from backend API)
export const initialCustomers = [];

// Initial Inventory Items across services (empty by default - managed by admin)
export const initialInventory = [];

// Initial Coupons (empty by default - managed by admin)
export const initialCoupons = [];

// Initial Notifications (empty by default - managed by admin)
export const initialNotifications = [];
