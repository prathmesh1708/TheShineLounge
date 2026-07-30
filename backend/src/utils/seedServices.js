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
        badge: ''
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
    pricing: [
      { title: 'Nitro Vanilla Sweet Cream Cold Brew', price: 240, gst: true, description: 'Velvety nitrogen infused dark roast espresso', displayOrder: 1 },
      { title: 'Artisanal Caramel Macchiato', price: 260, gst: true, description: 'Steamed milk, vanilla syrup, espresso, caramel drizzle', displayOrder: 2 },
      { title: 'Truffle Mushroom Sourdough Toast', price: 350, gst: true, description: 'Sauteed mushrooms, truffle butter on toasted sourdough', displayOrder: 3 }
    ],
    plans: [
      { name: 'Morning Brew Combo', price: 399, duration: 'Instant', features: ['Any Large Coffee', 'Butter Croissant or Danish'], recommended: true, displayOrder: 1 },
      { name: 'Lounge Executive Meal Package', price: 649, duration: 'Instant', features: ['Artisan Gourmet Sandwich', 'Specialty Beverage', 'Signature Dessert'], recommended: false, displayOrder: 2 }
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

const seedServices = async () => {
  try {
    const existingCount = await Service.countDocuments({ isDeleted: false });
    if (existingCount > 0) {
      console.log(`Services catalog already seeded (${existingCount} services exist). Skipping seed.`);
      return;
    }

    await Service.insertMany(initialServices);
    console.log(`✅ Seeded ${initialServices.length} dynamic services successfully!`);
  } catch (error) {
    console.error('❌ Error seeding services:', error.message);
  }
};

module.exports = seedServices;
