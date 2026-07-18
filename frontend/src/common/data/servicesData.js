export const servicesData = {
  cafe: {
    id: 'cafe',
    name: 'Café',
    tagline: 'Artisan coffees, fresh bakery delights, and custom brunch plates.',
    accentColor: '#8D5B28', // rich warm coffee brown
    menu: {
      'Hot Beverages': [
        { name: 'Espresso Double Shot', price: 3.50 },
        { name: 'Cortado / Macchiato', price: 4.00 },
        { name: 'Classic Cappuccino', price: 4.50 },
        { name: 'Madagascar Vanilla Latte', price: 5.00 },
        { name: 'Ceremonial Matcha Latte', price: 5.50 }
      ],
      'Cold Beverages': [
        { name: 'Shaken Iced Espresso', price: 4.75 },
        { name: 'Cold Brew Blend', price: 4.50 },
        { name: 'Hibiscus Peach Iced Tea', price: 4.25 },
        { name: 'Espresso Tonic', price: 5.50 }
      ],
      'Breakfast': [
        { name: 'Sourdough Avocado Toast', price: 11.00 },
        { name: 'Almond Croissant (Baked Fresh)', price: 5.50 },
        { name: 'Smoked Salmon Bagel', price: 13.50 }
      ],
      'Mains': [
        { name: 'Truffle Mushroom Panini', price: 14.00 },
        { name: 'Pesto Chicken Focaccia', price: 15.00 },
        { name: 'Shine Lounge Caesar Salad', price: 12.50 }
      ],
      'Desserts': [
        { name: 'Salted Caramel Tart', price: 6.50 },
        { name: 'Classic Tiramisu Slice', price: 7.00 },
        { name: 'Dark Chocolate Fudge Brownie', price: 5.00 }
      ]
    }
  },
  'drive-through-cafe': {
    id: 'drive-through-cafe',
    name: 'Drive-Through Café',
    tagline: 'Premium coffee and bites, served at speed for your journey.',
    accentColor: '#C17F19', // rich warm gold
    quickMenu: [
      { name: 'Quick Drip Coffee', price: 3.00 },
      { name: 'Drive-Through Iced Latte', price: 4.75 },
      { name: 'Butter Croissant', price: 4.00 },
      { name: 'Breakfast Sausage Wrap', price: 7.50 },
      { name: 'Double Chocolate Muffin', price: 4.50 }
    ],
    timeSlots: [
      '07:00 AM - 07:15 AM',
      '07:15 AM - 07:30 AM',
      '07:30 AM - 07:45 AM',
      '07:45 AM - 08:00 AM',
      '08:00 AM - 08:15 AM',
      '08:15 AM - 08:30 AM',
      '08:30 AM - 08:45 AM',
      '08:45 AM - 09:00 AM',
      '09:00 AM - 09:15 AM',
      '09:15 AM - 09:30 AM'
    ]
  },
  'car-wash': {
    id: 'car-wash',
    name: 'Car Wash',
    tagline: 'Eco-friendly touchless washing for a flawless shine.',
    accentColor: '#148F87', // deep teal
    plans: [
      { id: 'single-wash', name: 'Express Wash', price: 19.00, features: ['Exterior Foam Bath', 'Spot-Free Rinse', 'Express Air Dry'], isPopular: false },
      { id: 'monthly', name: 'Shine Monthly Pass', price: 39.00, features: ['Unlimited Express Washes', 'Underbody Spray', 'Wheel Cleaning'], isPopular: true },
      { id: 'annual', name: 'VIP Annual Elite', price: 349.00, features: ['Unlimited Washes', 'Ceramic Sealant Coating', 'Tire Dressing', 'Priority Lane'], isPopular: false }
    ],
    timeSlots: [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '01:00 PM - 02:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM'
    ]
  },
  'car-detailing': {
    id: 'car-detailing',
    name: 'Car Detailing',
    tagline: 'Deep interior restoration and professional paint correction.',
    accentColor: '#4A5568', // slate/graphite grey
    services: [
      { name: 'Interior Deep Clean & Steam', startPrice: 120.00 },
      { name: 'Exterior Ceramic Coating Protection', startPrice: 250.00 },
      { name: 'Full Paint Correction & Polish', startPrice: 350.00 },
      { name: 'The Shine Signature Restore (Interior + Exterior)', startPrice: 450.00 }
    ],
    timeSlots: [
      '08:30 AM - 12:30 PM (Morning Slot)',
      '01:00 PM - 05:00 PM (Afternoon Slot)'
    ]
  },
  'dog-wash': {
    id: 'dog-wash',
    name: 'Dog Bath',
    tagline: 'Self-serve and full-care tubs for happy, clean pups.',
    accentColor: '#2E7D32', // forest green
    durations: [
      { id: '2-min', name: 'Quick Rinse (2 Minutes)', price: 5.00 },
      { id: '5-min', name: 'Classic Bath (5 Minutes)', price: 10.00 },
      { id: '12-min', name: 'The Deluxe Groom (12 Minutes)', price: 20.00 }
    ],
    timeSlots: [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '01:00 PM - 02:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM'
    ]
  },
  salon: {
    id: 'salon',
    name: "Men's Salon",
    tagline: 'Expert precision haircuts, hot towels, and grooming rituals.',
    accentColor: '#7B1FA2', // plum purple
    services: [
      { name: 'Classic Scissors Cut', duration: '30 mins', price: 35.00 },
      { name: 'Signature Fade & Beard Trim', duration: '45 mins', price: 50.00 },
      { name: 'Hot Towel Royal Shave', duration: '30 mins', price: 30.00 },
      { name: 'Grooming Treatment Package', duration: '60 mins', price: 75.00 }
    ],
    barbers: ['Marcus Sterling', 'Leo Martinez', 'Dominic Vance', 'Adrian Brooks'],
    timeSlots: [
      '09:00 AM',
      '09:45 AM',
      '10:30 AM',
      '11:15 AM',
      '12:00 PM',
      '01:30 PM',
      '02:15 PM',
      '03:00 PM',
      '03:45 PM',
      '04:30 PM'
    ]
  }
};
