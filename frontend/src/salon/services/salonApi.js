// Mock database and helper methods for Salon & Beauty Booking Portal

export const CATEGORIES = [
  { id: "hair-cut", name: "Hair Cut", icon: "💇‍♂️", desc: "Precision style cuts" },
  { id: "hair-styling", name: "Hair Styling", icon: "✨", desc: "Blowouts & curls" },
  { id: "hair-coloring", name: "Hair Coloring", icon: "🎨", desc: "Balayage & highlights" },
  { id: "beard-trim", name: "Beard Trim", icon: "🧔", desc: "Precision beard shaping" },
  { id: "facial", name: "Facial", icon: "💆‍♀️", desc: "Hydrating skin resets" },
  { id: "cleanup", name: "Cleanup", icon: "🧼", desc: "Deep pore cleaning" },
  { id: "spa", name: "Spa", icon: "🛁", desc: "Full body relaxation" },
  { id: "massage", name: "Massage", icon: "💆", desc: "Therapeutic hot stone" },
  { id: "manicure", name: "Manicure", icon: "💅", desc: "Nail care & polish" },
  { id: "pedicure", name: "Pedicure", icon: "👣", desc: "Soothing foot spa" },
  { id: "makeup", name: "Makeup", icon: "💄", desc: "Party & evening looks" },
  { id: "bridal-makeup", name: "Bridal Makeup", icon: "👰", desc: "Flawless wedding styling" }
];

export const SERVICES = [
  {
    id: "hair-cut-premium",
    name: "Premium Hair Cut",
    category: "Hair Cut",
    price: 35,
    duration: "30 mins",
    rating: 4.9,
    reviewsCount: 238,
    tagline: "Custom consult, scalp massage wash, precision cut & styled finish.",
    description: "Treat yourself to a custom haircut experience. Includes a personal hair consultation, relaxing deep-clean wash with scalp massage, precision clipper/scissor cut, and styling using premium professional clays or sprays.",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
    features: ["Personalized style consultation", "Relaxing shampoo & conditioner wash", "Blow dry & premium product styling"],
    inclusions: ["Hair consultation", "Shampoo & scalp massage", "Precision cut", "Blow dry finish", "Matte clay or spray styling"]
  },
  {
    id: "hair-styling-blowout",
    name: "Luxury Blowout & Style",
    category: "Hair Styling",
    price: 45,
    duration: "45 mins",
    rating: 4.8,
    reviewsCount: 165,
    tagline: "Volumizing wash, round-brush blowout, and soft wave styling.",
    description: "Get bouncy, red-carpet ready hair. Includes a nourishing volumizing wash, standard round-brush blowout, and styling into loose beachy waves or sleek straight strands as requested.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600",
    features: ["Deep cleanse & volume mask", "Smooth round-brush blowout", "Beachy waves or straight finishing irons"],
    inclusions: ["Volume shampoo prep", "Hair gloss conditioning mask", "Round-brush blow dry", "Curling or flat iron work"]
  },
  {
    id: "hair-coloring-balayage",
    name: "Signature Balayage & Gloss",
    category: "Hair Coloring",
    price: 150,
    duration: "180 mins",
    rating: 5.0,
    reviewsCount: 310,
    tagline: "Hand-painted sun-kissed highlights, nourishing toner, and blowout.",
    description: "Achieve natural, low-maintenance dimension. Our master colorists hand-paint highlights to blend seamlessly with your root color, followed by a bonding toner gloss treatment to lock in shine.",
    image: "https://images.unsplash.com/photo-1560869713-7d0a29430f39?auto=format&fit=crop&q=80&w=600",
    features: ["Custom hand-painted highlights", "Plex bond-repair protective step", "Shiny moisture toner glossing"],
    inclusions: ["Full balayage application", "Ola-plex bond building solution", "Hydrating color toner", "Shampoo, blow dry & styling"]
  },
  {
    id: "beard-trim-royal",
    name: "Royal Beard Trim & Shave",
    category: "Beard Trim",
    price: 25,
    duration: "25 mins",
    rating: 4.7,
    reviewsCount: 184,
    tagline: "Hot towel steam, razor-line detailing, beard wash, and aromatic oil.",
    description: "The ultimate beard grooming service. Enjoy a soothing hot towel steam, precision beard scissor shaping, clean straight-razor detailing, and beard shampoo washing followed by refreshing conditioning oils.",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600",
    features: ["Steamed hot towel prep", "Precision beard lining & shave", "Scented beard balm & oil massage"],
    inclusions: ["Steamed towel conditioning", "Clipper trim & shape", "Straight razor edge lining", "Beard wash", "Organic sandalwood beard oil"]
  },
  {
    id: "facial-hydration",
    name: "Ocean Glow Hydrating Facial",
    category: "Facial",
    price: 60,
    duration: "50 mins",
    rating: 4.9,
    reviewsCount: 142,
    tagline: "Micro-exfoliation, marine collagen mask, serum infusion & cold roller massage.",
    description: "Instant skin replenishment for dry or tired skin. Our hydrating facial removes dead skin cells through micro-exfoliation, applies a soothing marine collagen mask, and infuses active hyaluronic serums.",
    image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=600",
    features: ["Fruit enzyme micro-peel", "Deep hydrating marine collagen mask", "Chilled jade roller facial massage"],
    inclusions: ["Double cleanse", "Fruit enzyme scrub", "Steamed pore extraction", "Hyaluronic serum infusion", "Jade roller massage"]
  },
  {
    id: "cleanup-detox",
    name: "Charcoal Detox Deep Cleanup",
    category: "Cleanup",
    price: 40,
    duration: "35 mins",
    rating: 4.6,
    reviewsCount: 95,
    tagline: "Sonic blackhead extraction, volcanic charcoal peel, and pore tightening.",
    description: "Deep pore cleanup targeted at removing blackheads and excess oil. Uses sonic scraping tools, warm steam, and a peel-off volcanic ash mask to absorb toxins and refine skin texture.",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=600",
    features: ["Pore-steaming & sonic scrub extraction", "Detoxifying charcoal peel-off mask", "Matte oil-control pore minimizer toner"],
    inclusions: ["Deep pore cleanser", "Steam treatment", "Sonic blackhead extraction", "Charcoal peel mask", "Pore-tightening cooling spray"]
  },
  {
    id: "spa-body-ritual",
    name: "Luxury Coconut Milk Body Spa",
    category: "Spa",
    price: 110,
    duration: "90 mins",
    rating: 4.95,
    reviewsCount: 120,
    tagline: "Brown sugar body scrub, warm coconut milk soak, and moisturizing wrap.",
    description: "Rejuvenate your skin and mind. Begin with an exfoliating brown sugar scrub, rinse in a warm coconut milk bath, and finish with a full-body nourishing butter wrap while enjoying a relaxing scalp massage.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600",
    features: ["Exfoliating brown sugar body scrub", "Soothing coconut milk bath ritual", "Full-body shea butter moisture wrap"],
    inclusions: ["Nourishing body scrub", "Warm milk tub rinse", "Shea butter hydration wrap", "Mini head massage"]
  },
  {
    id: "massage-hot-stone",
    name: "Therapeutic Hot Stone Massage",
    category: "Massage",
    price: 85,
    duration: "75 mins",
    rating: 4.9,
    reviewsCount: 154,
    tagline: "Volcanic basalt stones, deep tissue oil sweep, and acupressure release.",
    description: "Melt away muscle tension. Smooth, heated volcanic stones are placed along key acupressure points of the spine, palms, and feet, combined with deep-tissue Swedish massage sweeps using warm oils.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=600",
    features: ["Heated volcanic basalt placement", "Warm aromatherapy oils massage", "Targeted deep tissue tension release"],
    inclusions: ["Hot stone alignment", "Deep tissue massage sweeps", "Warm lavender body oil", "Warm compression pads"]
  },
  {
    id: "manicure-gel-gelish",
    name: "Premium Gel Gelish Manicure",
    category: "Manicure",
    price: 30,
    duration: "40 mins",
    rating: 4.7,
    reviewsCount: 205,
    tagline: "Cuticle care, nail shaping, gel polish application & LED curing.",
    description: "Chipped-free nails for up to 3 weeks! This manicure includes professional cuticle cleaning, nail shaping, base gel prep, dual coats of premium gelish color, LED light curing, and moisture cuticle oils.",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600",
    features: ["Professional cuticle trim & nail shaping", "Premium gel color coat selection", "UV/LED light dry curing"],
    inclusions: ["Nail trim & file", "Cuticle grooming", "Dehydrating prep step", "Gel base & color coat", "LED curing", "Cuticle oil rub"]
  },
  {
    id: "pedicure-paraffin-heel",
    name: "Luxury Paraffin Heel Pedicure",
    category: "Pedicure",
    price: 45,
    duration: "50 mins",
    rating: 4.8,
    reviewsCount: 118,
    tagline: "Dead skin scrape scrub, warm paraffin wax bath, and foot massage.",
    description: "Deep relief for cracked heels and dry feet. Includes a warm mineral salt foot scrub, professional heel scraping, nail clipping, a warm paraffin wax dip to trap moisture, and a relaxing lower leg massage.",
    image: "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&q=80&w=600",
    features: ["Mineral foot scrub & heel scraping", "Soothing warm paraffin wax bath", "Relieving foot & lower leg massage"],
    inclusions: ["Epsom salt foot soak", "Pumice heel filing", "Nail trim & cuticle tidy", "Warm paraffin dip", "10-min foot rub"]
  },
  {
    id: "makeup-glam-party",
    name: "Celebrity Glam Party Makeup",
    category: "Makeup",
    price: 90,
    duration: "60 mins",
    rating: 4.9,
    reviewsCount: 88,
    tagline: "Flawless HD airbrush foundation, dramatic eyes, and lash extensions.",
    description: "Stand out at any event. Features professional HD airbrush foundation makeup for a flawless matte look, customized eyeshadow detailing (smokey, glitter, or natural), eyeliner, lipstick shaping, and custom mink lashes.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600",
    features: ["Professional HD airbrush base setup", "Custom shadow palette detailing", "Premium mink strip eyelashes included"],
    inclusions: ["Skin priming prep", "HD airbrush foundation", "Eyeshadow & lip makeup", "Mink lash application", "Setting spray seal"]
  },
  {
    id: "bridal-makeup-royal",
    name: "Royal Heritage Bridal Makeup",
    category: "Bridal Makeup",
    price: 250,
    duration: "150 mins",
    rating: 5.0,
    reviewsCount: 75,
    tagline: "Comprehensive wedding styling, dupatta draping, jewelry setting & HD base.",
    description: "For your special day. A premium, step-by-step bridal styling service. Includes specialized HD makeup, custom contouring, false lash extensions, dupatta/veil draping, jewelry pinning, and a long-lasting hydration sealer.",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600",
    features: ["Long-lasting premium HD bridal makeup", "Hair styling & floral bun accessories", "Dupatta draping & jewelry placement styling"],
    inclusions: ["Hydrating skin therapy prep", "HD contour makeup base", "Custom lash inserts", "Dupatta/saree draping", "Hair bun & accessory pinning"]
  }
];

export const STYLISTS = [
  {
    id: "st-albert",
    name: "Albert Flores",
    rating: 4.95,
    experience: "8 years",
    specialization: "Precision Haircuts & Beard Sculpting",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    about: "Albert is a master barber specializing in modern fade styles, classic scissor cuts, and professional beard contouring. Having trained in Milan, he blends style with detail to craft cuts that complement individual facial architecture.",
    phone: "+91 98765 11223",
    portfolio: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&q=80&w=300"
    ],
    timeSlots: ["09:30 AM", "10:30 AM", "11:30 AM", "01:30 PM", "03:00 PM", "04:30 PM"]
  },
  {
    id: "st-darlene",
    name: "Darlene Robertson",
    rating: 4.90,
    experience: "6 years",
    specialization: "Bridal Makeup & Glam Makeovers",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
    about: "Darlene is a professional makeup artist and hairstylist specializing in high-definition bridal glam and modern event blowouts. She focuses on skin health preps to ensure products blend flawlessly and look glowing.",
    phone: "+91 98765 44556",
    portfolio: [
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=300"
    ],
    timeSlots: ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"]
  },
  {
    id: "st-leslie",
    name: "Leslie Alexander",
    rating: 4.85,
    experience: "5 years",
    specialization: "Exfoliation & Hot Stone Body Spa",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    about: "Leslie is a certified massage and skin therapist. She is passionate about deep pore detox therapies, body scrubbing scrubs, and hot stone muscular decompression techniques designed to alleviate city burnout.",
    phone: "+91 98765 77889",
    portfolio: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=300"
    ],
    timeSlots: ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"]
  }
];

export const PACKAGES = [
  {
    id: "sp-wedding-combo",
    name: "Wedding Glow Bridal Combo",
    price: 320,
    duration: "240 mins",
    popular: true,
    badge: "Most Popular Combo",
    features: [
      "Royal Heritage Bridal Makeup",
      "Hydrating Collagen Facial",
      "Manicure & Pedicure Gel Combo",
      "Hair Styling Bun & Flowers",
      "Premium Refreshment Platter"
    ]
  },
  {
    id: "sp-groom-combo",
    name: "Premium Gentleman's Grooming",
    price: 85,
    duration: "100 mins",
    popular: false,
    badge: "Elite Package",
    features: [
      "Premium Precision Haircut",
      "Royal Beard Shave & Steams",
      "Deep Pore Charcoal Cleanup",
      "Scalp Cleansing Hair Mud Pack",
      "Face Hydration Spritz"
    ]
  },
  {
    id: "sp-restoration-spa",
    name: "Rejuvenating Spa & Hot Stone Ritual",
    price: 160,
    duration: "150 mins",
    popular: false,
    badge: "Ultimate Reset",
    features: [
      "Hot Volcanic Stone Massage",
      "Hydrating Ocean Glow Facial",
      "Steamed Foot Scrub Spa Soak",
      "Aromatherapy Herbal Tea"
    ]
  }
];

export const OFFERS = [
  {
    id: "off-salon-15",
    badge: "GLAM UP 15",
    code: "BEAUTY15",
    title: "15% OFF on Salon Bookings",
    description: "Welcome to relaxation! Claim 15% flat off on any Hair Styling, Facials, or Massage services.",
    validUntil: "Nov 30, 2026",
    type: "percentage",
    value: 15,
    minAmount: 30
  },
  {
    id: "off-spa-flat",
    badge: "SPA REFRESH FLAT",
    code: "RESET20",
    title: "Flat ₹200 Cashback on Body Spas",
    description: "Treat your body. Book any Body Spa or Massage over ₹80 to receive flat cashback credits.",
    validUntil: "Oct 15, 2026",
    type: "flat",
    value: 20,
    minAmount: 80
  },
  {
    id: "off-refer-glam",
    badge: "REFERRAL REWARD",
    code: "SHINEGLAM",
    title: "Refer a Friend, Get $10 Credits",
    description: "Spread the beauty. Your friend gets $10 off, and you receive $10 in credit after their first visit.",
    validUntil: "Dec 31, 2026",
    type: "percentage",
    value: 10,
    minAmount: 20
  }
];

export const REVIEWS = [
  {
    id: 1,
    name: "Meera Sen",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    date: "2026-07-05",
    service: "Royal Heritage Bridal Makeup",
    stylist: "Darlene Robertson",
    comment: "Darlene did my wedding makeup and it was absolutely stunning! The base didn't budge for 10 hours despite Indore's heat. Highly recommend her for bridal prep!"
  },
  {
    id: 2,
    name: "Aditya Roy",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    date: "2026-07-09",
    service: "Premium Hair Cut & Beard Royal",
    stylist: "Albert Flores",
    comment: "Albert is an absolute artist with clippers. Best taper fade I've ever had in my life. Scalp massage and steamed towels are pure luxury!"
  },
  {
    id: 3,
    name: "Simran Kaur",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
    rating: 4,
    date: "2026-07-14",
    service: "Luxury Coconut Milk Body Spa",
    stylist: "Leslie Alexander",
    comment: "Excellent body scrub and warm coconut soak by Leslie. My skin feels like silk. Docked 1 star because the receptionist booked the wrong slot time initially, but they sorted it quickly."
  }
];

export const FAQS = [
  {
    q: "Can I choose my preferred stylist during the booking process?",
    a: "Absolutely! During booking, you can choose from our list of certified experts like Albert, Darlene, or Leslie depending on their availability, or select 'Any Stylist' for auto-assignment."
  },
  {
    q: "What products do you use for coloring and facial masks?",
    a: "We only use premium, hypoallergenic professional brands. Hair coloring uses plex bond builders, and facials use natural enzymes and hyaluronic marine collagen serums."
  },
  {
    q: "Is there a cancellation or rescheduling fee?",
    a: "Rescheduling is free up to 2 hours before the session. Cancellations within 2 hours of the appointment will incur a 20% convenience slot charge."
  }
];

export const MOCK_BOOKINGS = [
  {
    id: "BK-8023",
    package: "Premium Hair Cut & Royal Beard Shave",
    status: "Upcoming",
    date: "2026-07-21",
    time: "11:30 AM - 12:30 PM",
    service: "Premium Hair Cut",
    stylist: "Albert Flores",
    location: "Shine Lounge Salon, Vijay Nagar, Indore",
    price: 60,
    timeline: [
      { status: "Appointment Placed", time: "02:00 PM", active: true },
      { status: "Stylist Confirmed", time: "02:15 PM", active: true },
      { status: "Stylist Assigned", time: "02:30 PM", active: true }
    ]
  },
  {
    id: "BK-4102",
    package: "Ocean Glow Hydrating Facial",
    status: "Completed",
    date: "2026-07-10",
    time: "03:00 PM - 03:50 PM",
    service: "Ocean Glow Hydrating Facial",
    stylist: "Leslie Alexander",
    location: "Shine Lounge Salon, Vijay Nagar, Indore",
    price: 60,
    timeline: []
  },
  {
    id: "BK-1934",
    package: "Luxury Blowout & Wave Styling",
    status: "Cancelled",
    date: "2026-07-02",
    time: "04:30 PM - 05:15 PM",
    service: "Luxury Blowout & Style",
    stylist: "Darlene Robertson",
    location: "Shine Lounge Salon, Vijay Nagar, Indore",
    price: 45,
    timeline: []
  }
];

// Helper methods with dynamic localStorage support and event notifications

export const DEFAULT_SALON_TIME_SLOTS = [
  { id: "slot-1", time: "09:00 AM", status: "active", category: "Morning" },
  { id: "slot-2", time: "09:30 AM", status: "active", category: "Morning" },
  { id: "slot-3", time: "10:00 AM", status: "active", category: "Morning" },
  { id: "slot-4", time: "10:30 AM", status: "active", category: "Morning" },
  { id: "slot-5", time: "11:00 AM", status: "active", category: "Morning" },
  { id: "slot-6", time: "11:30 AM", status: "active", category: "Morning" },
  { id: "slot-7", time: "01:00 PM", status: "active", category: "Afternoon" },
  { id: "slot-8", time: "01:30 PM", status: "active", category: "Afternoon" },
  { id: "slot-9", time: "02:00 PM", status: "active", category: "Afternoon" },
  { id: "slot-10", time: "03:00 PM", status: "active", category: "Afternoon" },
  { id: "slot-11", time: "04:00 PM", status: "active", category: "Evening" },
  { id: "slot-12", time: "04:30 PM", status: "active", category: "Evening" },
  { id: "slot-13", time: "05:00 PM", status: "active", category: "Evening" },
  { id: "slot-14", time: "06:00 PM", status: "active", category: "Evening" }
];

const STORAGE_KEY_SALON_SERVICES = 'shine_salon_services';
const STORAGE_KEY_SALON_PACKAGES = 'shine_salon_packages';
const STORAGE_KEY_SALON_CATEGORIES = 'shine_salon_categories';
const STORAGE_KEY_SALON_TIME_SLOTS = 'shine_salon_time_slots';

const notifyDataChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('salonDataChanged'));
  }
};

export const getTimeSlotsSync = () => {
  if (typeof window === 'undefined') return DEFAULT_SALON_TIME_SLOTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SALON_TIME_SLOTS);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEY_SALON_TIME_SLOTS, JSON.stringify(DEFAULT_SALON_TIME_SLOTS));
    return DEFAULT_SALON_TIME_SLOTS;
  } catch (err) {
    console.error('Error reading salon time slots from localStorage:', err);
    return DEFAULT_SALON_TIME_SLOTS;
  }
};

export const getTimeSlots = () => Promise.resolve(getTimeSlotsSync());

export const saveTimeSlot = (slotData) => {
  const currentSlots = getTimeSlotsSync();
  const existingIndex = currentSlots.findIndex(s => s.id === slotData.id || (slotData.id && s.id === slotData.id) || s.time.toLowerCase() === (slotData.time || '').toLowerCase());

  let updatedList;
  if (existingIndex !== -1) {
    updatedList = [...currentSlots];
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      ...slotData
    };
  } else {
    const newId = slotData.id || `slot-${Date.now()}`;
    const newSlot = {
      id: newId,
      time: slotData.time || '10:00 AM',
      status: slotData.status || 'active',
      category: slotData.category || 'General'
    };
    updatedList = [...currentSlots, newSlot];
  }

  try {
    localStorage.setItem(STORAGE_KEY_SALON_TIME_SLOTS, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Error saving salon time slot:', e);
  }
  notifyDataChange();
  return Promise.resolve(updatedList);
};

export const deleteTimeSlot = (id) => {
  const currentSlots = getTimeSlotsSync();
  const updatedList = currentSlots.filter(s => s.id !== id && s.time !== id);

  try {
    localStorage.setItem(STORAGE_KEY_SALON_TIME_SLOTS, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Error deleting salon time slot:', e);
  }
  notifyDataChange();
  return Promise.resolve(updatedList);
};


export const getCategoriesSync = () => {
  if (typeof window === 'undefined') return CATEGORIES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SALON_CATEGORIES);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEY_SALON_CATEGORIES, JSON.stringify(CATEGORIES));
    return CATEGORIES;
  } catch (err) {
    return CATEGORIES;
  }
};

export const getCategories = () => Promise.resolve(getCategoriesSync());

export const getServicesSync = () => {
  if (typeof window === 'undefined') return SERVICES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SALON_SERVICES);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(STORAGE_KEY_SALON_SERVICES, JSON.stringify(SERVICES));
    return SERVICES;
  } catch (err) {
    console.error('Error reading salon services from localStorage:', err);
    return SERVICES;
  }
};

export const getServices = () => Promise.resolve(getServicesSync());

export const getServiceById = (id) => {
  const allServices = getServicesSync();
  return Promise.resolve(allServices.find(s => s.id === id || s._id === id));
};

export const saveService = (serviceData) => {
  const currentServices = getServicesSync();
  const existingIndex = currentServices.findIndex(s => s.id === serviceData.id || (serviceData.id && s.id === serviceData.id));

  let updatedList;
  if (existingIndex !== -1) {
    updatedList = [...currentServices];
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      ...serviceData
    };
  } else {
    const newId = serviceData.id || serviceData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newService = {
      id: newId,
      name: serviceData.name || 'New Salon Service',
      category: serviceData.category || 'Hair Cut',
      price: Number(serviceData.price) || 25,
      duration: serviceData.duration || '30 mins',
      rating: Number(serviceData.rating) || 4.9,
      reviewsCount: Number(serviceData.reviewsCount) || 1,
      tagline: serviceData.tagline || '',
      description: serviceData.description || '',
      image: serviceData.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
      status: serviceData.status || 'active',
      icon: serviceData.icon || '💇‍♂️',
      features: Array.isArray(serviceData.features) ? serviceData.features : (serviceData.features ? serviceData.features.split('\n').filter(Boolean) : []),
      inclusions: Array.isArray(serviceData.inclusions) ? serviceData.inclusions : (serviceData.inclusions ? serviceData.inclusions.split('\n').filter(Boolean) : [])
    };
    updatedList = [newService, ...currentServices];
  }

  try {
    localStorage.setItem(STORAGE_KEY_SALON_SERVICES, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Error saving salon service:', e);
  }
  notifyDataChange();
  return Promise.resolve(updatedList);
};

export const updateServicePrice = (id, newPrice) => {
  const currentServices = getServicesSync();
  const updatedList = currentServices.map(s => {
    if (s.id === id || s._id === id) {
      return { ...s, price: Number(newPrice) };
    }
    return s;
  });

  try {
    localStorage.setItem(STORAGE_KEY_SALON_SERVICES, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Error updating salon service price:', e);
  }
  notifyDataChange();
  return Promise.resolve(updatedList);
};

export const deleteService = (id) => {
  const currentServices = getServicesSync();
  const updatedList = currentServices.filter(s => s.id !== id && s._id !== id);

  try {
    localStorage.setItem(STORAGE_KEY_SALON_SERVICES, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Error deleting salon service:', e);
  }
  notifyDataChange();
  return Promise.resolve(updatedList);
};

export const getPackagesSync = () => {
  if (typeof window === 'undefined') return PACKAGES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SALON_PACKAGES);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEY_SALON_PACKAGES, JSON.stringify(PACKAGES));
    return PACKAGES;
  } catch (err) {
    return PACKAGES;
  }
};

export const getPackages = () => Promise.resolve(getPackagesSync());

export const getBookings = () => Promise.resolve(MOCK_BOOKINGS);

export const getStylistsSync = () => {
  try {
    const adminStaff = localStorage.getItem('tsl_admin_staff_list');
    const salonStaffLocal = localStorage.getItem('tsl_salon_staff');

    let custom = [];

    if (adminStaff) {
      const parsed = JSON.parse(adminStaff);
      const filtered = parsed.filter(s => !s.serviceKey || s.serviceKey === 'salon' || (s.department && s.department.toLowerCase().includes('salon')));
      custom.push(...filtered);
    }
    if (salonStaffLocal) {
      const parsedLocal = JSON.parse(salonStaffLocal);
      parsedLocal.forEach(st => {
        if (!custom.some(c => (c.email && st.email && c.email.toLowerCase() === st.email.toLowerCase()) || c.id === st.id || c._id === st._id)) {
          custom.push(st);
        }
      });
    }

    if (custom.length > 0) {
      return custom.map((st, idx) => ({
        id: st._id || st.id || `st-admin-${idx}`,
        _id: st._id || st.id || `st-admin-${idx}`,
        name: st.fullName || st.name || 'Salon Stylist',
        fullName: st.fullName || st.name || 'Salon Stylist',
        specialization: st.staffRole || st.role || 'Salon Styling Master',
        staffRole: st.staffRole || st.role || 'Salon Styling Master',
        rating: st.rating || 4.9,
        experience: st.experience || '5+ years',
        avatar: st.photo || st.profileImage || st.avatar || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150",
        phone: st.mobile || "+91 98210 77777",
        timeSlots: ["09:30 AM", "10:30 AM", "11:30 AM", "01:30 PM", "03:00 PM", "04:30 PM"]
      }));
    }
  } catch (err) {
    console.warn('Error reading local stylists:', err);
  }
  return STYLISTS;
};

export const getStylists = () => Promise.resolve(getStylistsSync());
export const getStylistById = (id) => Promise.resolve(getStylistsSync().find(s => s.id === id || s._id === id));
export const getOffers = () => Promise.resolve(OFFERS);
export const getReviews = () => Promise.resolve(REVIEWS);
export const getFAQs = () => Promise.resolve(FAQS);

