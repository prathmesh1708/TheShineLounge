const Service = require('../models/Service');

const initialServices = [
  {
    serviceName: 'Tunnel Car Wash',
    slug: 'car-wash',
    category: 'Automotive',
    shortDescription: 'High-speed automated tunnel wash with touchless dry & tire shine.',
    description: 'Experience express premium vehicle cleaning in our state-of-the-art automated wash tunnel equipped with soft cloth tech, ceramic sealants, and underbody flush.',
    icon: 'Car',
    bannerImage: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=400&q=80',
    displayOrder: 1,
    isActive: true,
    showOnHome: true,
    showInNavbar: true,
    theme: {
      primaryColor: '#1e4a7e',
      secondaryColor: '#e07b2a',
      textColor: '#1f2937',
      gradient: 'from-blue-900 via-blue-800 to-indigo-900',
      buttonColor: '#e07b2a',
      cardColor: '#ffffff',
      iconColor: '#3b82f6',
      background: '#f8fafc',
      hoverColor: '#c9681f'
    },
    pricing: [
      { title: 'Single Wash', price: 699, gst: true, description: 'Complimentary – vacuum, polish, mat cleaning', displayOrder: 1 }
    ],
    memberships: [
      {
        name: 'Monthly Membership',
        price: 2499,
        duration: 30,
        durationType: 'days',
        visitLimit: 4,
        oneVisitPerDay: true,
        benefits: ['Up to 4 washes/month + interior car fragrance'],
        renewable: true,
        upgradeAvailable: true,
        isPopular: false,
        badge: 'PASS'
      },
      {
        name: 'Yearly Membership',
        price: 19999,
        duration: 365,
        durationType: 'days',
        visitLimit: 365,
        oneVisitPerDay: true,
        benefits: ['Unlimited washes + ceramic coating & 5x car fragrance'],
        renewable: true,
        upgradeAvailable: false,
        isPopular: true,
        badge: 'BEST VALUE'
      }
    ],
    features: [
      { title: 'Touchless Soft Cloth Tech', description: 'Gentle paint-safe microfiber brushes', icon: 'Sparkles', displayOrder: 1 },
      { title: 'Underbody Rust Shield', description: 'High pressure underbody jet cleaning', icon: 'Shield', displayOrder: 2 },
      { title: 'Ceramic Sealant Finish', description: 'Hydrophobic shine protection layer', icon: 'Droplets', displayOrder: 3 }
    ]
  },
  {
    serviceName: 'Car Detailing',
    slug: 'car-detailing',
    category: 'Automotive',
    shortDescription: 'Precision paint correction, ceramic coatings, and interior restoration.',
    description: 'Comprehensive restorative detailing designed for luxury vehicles. Includes multi-stage machine polishing, ceramic paint protection, PPF, and deep interior steam sanitation.',
    icon: 'Wrench',
    bannerImage: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80',
    displayOrder: 2,
    isActive: true,
    showOnHome: true,
    showInNavbar: true,
    theme: {
      primaryColor: '#0f766e',
      secondaryColor: '#e07b2a',
      textColor: '#1f2937',
      gradient: 'from-emerald-900 via-teal-800 to-cyan-900',
      buttonColor: '#0d9488',
      cardColor: '#ffffff',
      iconColor: '#14b8a6',
      background: '#f0fdf4',
      hoverColor: '#0f766e'
    },
    pricing: [
      { title: 'Interior Deep Detail', price: 2499, gst: true, description: 'Steam clean, leather conditioning, ozone odor removal', displayOrder: 1 },
      { title: 'Exterior Paint Correction', price: 4999, gst: true, description: '2-stage machine polish & swirl removal', displayOrder: 2 },
      { title: '9H Nano Ceramic Coating', price: 14999, gst: true, description: '3-year paint warranty + hydrophobic coat', displayOrder: 3 }
    ],
    plans: [
      { name: 'Ceramic Package', price: 14999, duration: '2 Days', features: ['9H Ceramic Layer', 'Glass Coating', 'Wheel Armor'], recommended: true, displayOrder: 1 },
      { name: 'Graphene Elite Package', price: 24999, duration: '3 Days', features: ['10H Graphene Coating', 'Self-Healing Tech', 'Interior Armor'], recommended: false, displayOrder: 2 },
      { name: 'Full Vehicle PPF', price: 79999, duration: '4 Days', features: ['TPU Paint Protection Film', '10-Year Anti-Yellowing Warranty'], recommended: false, displayOrder: 3 }
    ],
    features: [
      { title: 'Multi-Stage Polish', description: 'Removes up to 95% of paint defects & swirls', icon: 'Sparkles', displayOrder: 1 },
      { title: '100°C Steam Sanitation', description: 'Eliminates 99.9% of cabin bacteria & odors', icon: 'Flame', displayOrder: 2 }
    ]
  },
  {
    serviceName: 'Dog Wash',
    slug: 'dog-wash',
    category: 'Pet Care',
    shortDescription: 'Self-serve & full-service hydrobath pet grooming lounge.',
    description: 'Treat your furry friend to a relaxing warm hydrobath, organic herbal shampoos, flea treatments, and warm velocity blow drying in our climate-controlled pet spa.',
    icon: 'Dog',
    bannerImage: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80',
    // Deliberately no heroVideo here: '/src/...' is a Vite dev-server-only
    // path and 404s in the production build. The frontend already falls
    // back to its bundled dog-wash-banner.mp4 import when this is empty.
    thumbnail: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=400&q=80',
    displayOrder: 3,
    isActive: true,
    showOnHome: true,
    showInNavbar: true,
    theme: {
      primaryColor: '#7c3aed',
      secondaryColor: '#f59e0b',
      textColor: '#1f2937',
      gradient: 'from-purple-900 via-violet-800 to-indigo-900',
      buttonColor: '#7c3aed',
      cardColor: '#ffffff',
      iconColor: '#a855f7',
      background: '#faf5ff',
      hoverColor: '#6d28d9'
    },
    pricing: [
      { title: '2 Minutes Wash', price: 100, gst: true, description: 'Quick 2 minutes warm hydrobath session', displayOrder: 1 },
      { title: '5 Minutes Wash', price: 200, gst: true, description: 'Standard 5 minutes warm hydrobath session', displayOrder: 2 },
      { title: '12 Minutes Wash', price: 500, gst: true, description: 'Extended 12 minutes deluxe warm hydrobath session', displayOrder: 3 }
    ],
    plans: [
      { name: '2 Minutes Wash', price: 100, duration: '2 Mins', features: ['Quick 2 minutes warm hydrobath session'], recommended: false, displayOrder: 1 },
      { name: '5 Minutes Wash', price: 200, duration: '5 Mins', features: ['Standard 5 minutes warm hydrobath session'], recommended: true, displayOrder: 2 },
      { name: '12 Minutes Wash', price: 500, duration: '12 Mins', features: ['Extended 12 minutes deluxe warm hydrobath session'], recommended: false, displayOrder: 3 }
    ],
    memberships: [
      {
        name: 'Monthly Dog Spa Pass',
        price: 999,
        duration: 30,
        durationType: 'days',
        visitLimit: 4,
        oneVisitPerDay: true,
        benefits: ['4 Self-Serve Hydrobath washes per month', 'Free Treat Bag', '10% Off Pet Grooming Toys'],
        renewable: true,
        upgradeAvailable: true,
        isPopular: true,
        badge: 'Pet Parent Favorite'
      }
    ]
  },
  {
    serviceName: 'Café',
    slug: 'cafe',
    category: 'Hospitality',
    shortDescription: 'Artisanal cold brews, specialty lattes, and fresh gourmet bites.',
    description: 'Relax in our luxury lounge while waiting for your car or grooming service. Enjoy single-origin espresso, nitrogen-infused cold brews, artisan sandwiches, and gourmet pastries.',
    icon: 'Coffee',
    bannerImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
    displayOrder: 4,
    isActive: true,
    showOnHome: true,
    showInNavbar: true,
    theme: {
      primaryColor: '#78350f',
      secondaryColor: '#d97706',
      textColor: '#1f2937',
      gradient: 'from-amber-950 via-yellow-900 to-amber-900',
      buttonColor: '#b45309',
      cardColor: '#ffffff',
      iconColor: '#f59e0b',
      background: '#fffbeb',
      hoverColor: '#92400e'
    },
    pricing: [],
    menuSections: [
      {
        title: 'Main Menu',
        subtitle: 'Complete list of premium lounge meals',
        description: 'Prepared fresh, served within 15 minutes',
        bgColor: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
        displayOrder: 1
      },
      {
        title: 'Express Menu',
        subtitle: 'Fast barista brews and fresh croissants',
        description: 'Ready in 2 minutes for immediate pickup',
        bgColor: 'linear-gradient(135deg, #FA541C 0%, #D4380D 100%)',
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
        displayOrder: 2
      },
      {
        title: 'Cakes & Sweet Tarts',
        subtitle: 'Chef-crafted desserts and sweet plates',
        description: 'Prepared and decorated within 12 minutes',
        bgColor: 'linear-gradient(135deg, #B7094C 0%, #800E13 100%)',
        image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80',
        displayOrder: 3
      },
      {
        title: 'Oven-Hot Bakery',
        subtitle: 'Savory pies and warm artisan pastries',
        description: 'Freshly baked and served hot from the oven',
        bgColor: 'linear-gradient(135deg, #A06A42 0%, #704224 100%)',
        image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80',
        displayOrder: 4
      }
    ],
    plans: [
      { name: 'Sourdough Avocado Toast', price: 11.00, weight: '220g', image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=400&q=80', section: 'Main Menu', subcat: 'Brunch', duration: '15 mins', status: 'active', displayOrder: 1 },
      { name: 'Truffle Mushroom Panini', price: 14.00, weight: '250g', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80', section: 'Main Menu', subcat: 'Mains', duration: '15 mins', status: 'active', displayOrder: 2 },
      { name: 'Pesto Chicken Focaccia', price: 15.00, weight: '280g', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80', section: 'Main Menu', subcat: 'Mains', duration: '15 mins', status: 'active', displayOrder: 3 },
      { name: 'Smoked Salmon Bagel', price: 13.50, weight: '240g', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80', section: 'Main Menu', subcat: 'Brunch', duration: '15 mins', status: 'active', displayOrder: 4 },
      { name: 'Shine Lounge Caesar Salad', price: 12.50, weight: '200g', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400&q=80', section: 'Main Menu', subcat: 'Mains', duration: '15 mins', status: 'active', displayOrder: 5 },
      
      { name: 'Espresso Double Shot', price: 3.50, weight: '60ml', image: 'https://images.unsplash.com/photo-151097252790b-af4f902673a1?auto=format&fit=crop&w=400&q=80', section: 'Express Menu', subcat: 'Coffee', duration: '2 mins', status: 'active', displayOrder: 6 },
      { name: 'Cortado / Macchiato', price: 4.00, weight: '80ml', image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=400&q=80', section: 'Express Menu', subcat: 'Coffee', duration: '2 mins', status: 'active', displayOrder: 7 },
      { name: 'Classic Cappuccino', price: 4.50, weight: '180ml', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=400&q=80', section: 'Express Menu', subcat: 'Coffee', duration: '2 mins', status: 'active', displayOrder: 8 },
      { name: 'Madagascar Vanilla Latte', price: 5.00, weight: '220ml', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80', section: 'Express Menu', subcat: 'Coffee', duration: '2 mins', status: 'active', displayOrder: 9 },
      { name: 'Ceremonial Matcha Latte', price: 5.50, weight: '220ml', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80', section: 'Express Menu', subcat: 'Tea', duration: '2 mins', status: 'active', displayOrder: 10 },
      { name: 'Shaken Iced Espresso', price: 4.75, weight: '240ml', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80', section: 'Express Menu', subcat: 'Iced', duration: '2 mins', status: 'active', displayOrder: 11 },
      { name: 'Cold Brew Blend', price: 4.50, weight: '240ml', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80', section: 'Express Menu', subcat: 'Iced', duration: '2 mins', status: 'active', displayOrder: 12 },
      { name: 'Almond Croissant', price: 5.50, weight: '110g', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80', section: 'Express Menu', subcat: 'Bakery', duration: '2 mins', status: 'active', displayOrder: 13 },

      { name: 'Salted Caramel Chocolate Tart', price: 6.50, weight: '120g', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80', section: 'Cakes & Sweet Tarts', subcat: 'Tarts', duration: '12 mins', status: 'active', displayOrder: 14 },
      { name: 'Classic Tiramisu Slice', price: 7.00, weight: '140g', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&q=80', section: 'Cakes & Sweet Tarts', subcat: 'Cakes', duration: '12 mins', status: 'active', displayOrder: 15 },
      { name: 'Dark Chocolate Fudge Brownie', price: 5.00, weight: '90g', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80', section: 'Cakes & Sweet Tarts', subcat: 'Cakes', duration: '12 mins', status: 'active', displayOrder: 16 },

      { name: 'Almond Croissant (Warm)', price: 5.50, weight: '110g', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80', section: 'Oven-Hot Bakery', subcat: 'Sweet', duration: '5 mins', status: 'active', displayOrder: 17 },
      { name: 'Truffle Mushroom Pie', price: 14.00, weight: '250g', image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80', section: 'Oven-Hot Bakery', subcat: 'Savory', duration: '5 mins', status: 'active', displayOrder: 18 },
      { name: 'Smoked Salmon Bagel (Toasted)', price: 13.50, weight: '240g', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80', section: 'Oven-Hot Bakery', subcat: 'Savory', duration: '5 mins', status: 'active', displayOrder: 19 }
    ]
  },
  {
    serviceName: 'Drive Through Café',
    slug: 'drive-through-cafe',
    category: 'Hospitality',
    shortDescription: 'Express drive-thru coffee & breakfast on the move.',
    description: 'Get your daily caffeine fix without stepping out of your vehicle. Fast 90-second drive-thru serving hot coffee, iced frappes, and breakfast wraps.',
    icon: 'CupSoda',
    bannerImage: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=400&q=80',
    displayOrder: 5,
    isActive: true,
    showOnHome: true,
    showInNavbar: true,
    theme: {
      primaryColor: '#c2410c',
      secondaryColor: '#f97316',
      textColor: '#1f2937',
      gradient: 'from-orange-950 via-red-900 to-amber-950',
      buttonColor: '#ea580c',
      cardColor: '#ffffff',
      iconColor: '#fb923c',
      background: '#fff7ed',
      hoverColor: '#c2410c'
    },
    pricing: [
      { title: 'Express Commuter Iced Americano', price: 180, gst: true, description: 'Double shot espresso over ice', displayOrder: 1 },
      { title: 'Drive-Thru Breakfast Wrap', price: 280, gst: true, description: 'Scrambled eggs, cheese, avocado wrap', displayOrder: 2 }
    ]
  },
  {
    serviceName: "Men's Salon",
    slug: 'salon',
    category: 'Personal Care',
    shortDescription: 'Executive haircutting, beard sculpting, and facial treatments.',
    description: 'Step into luxury grooming tailored for men. Enjoy precision haircuts, hot towel razor shaves, scalp therapies, and rejuvenating charcoal facials.',
    icon: 'Scissors',
    bannerImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
    displayOrder: 6,
    isActive: true,
    showOnHome: true,
    showInNavbar: true,
    theme: {
      primaryColor: '#00837e',
      secondaryColor: '#00b8b0',
      textColor: '#1f2937',
      gradient: 'from-cyan-950 via-teal-900 to-emerald-950',
      buttonColor: '#00b8b0',
      cardColor: '#ffffff',
      iconColor: '#00b8b0',
      background: '#f0fdfa',
      hoverColor: '#00837e'
    },
    pricing: [
      { title: 'Executive Haircut & Styling', price: 499, gst: true, description: 'Consultation, scalp massage wash, haircut & styling', displayOrder: 1 },
      { title: 'Royal Hot Towel Beard Sculpting', price: 349, gst: true, description: 'Beard trim, straight razor line, essential oil hot towel', displayOrder: 2 },
      { title: 'Deep Detox Charcoal Facial', price: 899, gst: true, description: 'Exfoliation, blackhead extraction, charcoal mask', displayOrder: 3 }
    ],
    plans: [
      { name: 'Gentleman Grooming Combo', price: 799, duration: '45 mins', features: ['Executive Haircut', 'Beard Trim', 'Head Massage'], recommended: true, displayOrder: 1 },
      { name: 'VIP Royal Treatment Package', price: 1499, duration: '75 mins', features: ['Haircut', 'Royal Beard Spa', 'Charcoal Facial', 'Pedicure'], recommended: false, displayOrder: 2 }
    ]
  }
];

const Booking = require('../models/Booking');

const seedServices = async () => {
  try {
    for (const serviceData of initialServices) {
      const existing = await Service.findOne({ slug: serviceData.slug, isDeleted: false });
      if (existing) {
        // Update the fields while keeping the document ID
        await Service.updateOne({ slug: serviceData.slug }, { $set: serviceData });
      } else {
        await Service.create(serviceData);
      }
    }
    console.log(`✅ Seeded & Synced ${initialServices.length} dynamic services successfully!`);

    // Ensure initial offline sale is seeded
    const existingSale = await Booking.findOne({ bookingId: 'OFS-MTJX5GRW-3986' });
    if (!existingSale) {
      await Booking.create({
        bookingId: 'OFS-MTJX5GRW-3986',
        customerName: 'Prathmesh Jawade',
        customerEmail: 'prathmesh@gmail.com',
        phone: '98098090',
        serviceKey: 'car-wash',
        serviceName: 'Car Wash',
        packageName: 'Single Wash',
        price: 499,
        date: 'September 2, 2026',
        timeSlot: '03:23 PM - 03:53 PM',
        status: 'Completed',
        paymentMode: 'Cash',
        vehicleNo: 'MP09GG8790',
        vehicleType: 'HYUNDAI i20',
        isOfflineSale: true,
        saleType: 'service',
        notes: 'Walk-in counter sale'
      });
      console.log('✅ Seeded default offline sale OFS-MTJX5GRW-3986');
    }
  } catch (error) {
    console.error('❌ Error seeding services:', error.message);
  }
};

module.exports = seedServices;
