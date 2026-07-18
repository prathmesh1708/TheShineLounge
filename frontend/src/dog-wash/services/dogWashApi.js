// Mock database and helper methods for Dog Wash & Grooming

export const SERVICES = [
  {
    id: "basic-wash",
    name: "Quick Rinse",
    category: "Washing",
    price: 100,
    duration: "2 mins",
    rating: 4.8,
    reviewsCount: 142,
    tagline: "Standard warm water bath, pH-balanced shampoo, & high-velocity blow dry.",
    description: "Quick warm-water spray and towel pat dry, ideal for a fast refresh.",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600",
    features: [
      "Warm water shampoo scrub",
      "Gentle face wipe",
      "Blow dry & brush out",
      "Scented finishing spritz"
    ],
    inclusions: [
      "Premium oatmeal shampoo",
      "Warm water rinse",
      "Towel dry + blow dry",
      "Basic brush out",
      "Spritz of sweet cologne"
    ]
  },
  {
    id: "premium-wash",
    name: "Classic Bath",
    category: "Washing",
    price: 200,
    duration: "5 mins",
    rating: 4.9,
    reviewsCount: 218,
    tagline: "Aloe conditioner treatment, blow dry, nail clip, & ear flush.",
    description: "Deep coat warm-water shampoo scrub, towel dry + blow dry, and basic brush out.",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=600",
    features: [
      "Aloe vera deep conditioner",
      "Nail clipping & filing",
      "Ear flush & cleaning",
      "Undercoat deshedding brush"
    ],
    inclusions: [
      "All Basic Wash services",
      "Deep moisture conditioner",
      "Nail trim & grind",
      "Ear sanitizing flush",
      "De-shedding brush out"
    ]
  },
  {
    id: "full-grooming",
    name: "The Deluxe Groom",
    category: "Grooming",
    price: 500,
    duration: "12 mins",
    rating: 5.0,
    reviewsCount: 345,
    tagline: "Complete breed-standard haircut, warm bath, blow dry, and full styling.",
    description: "Aloe conditioner, warm-water jacuzzi bubble massage, ear flush, and full brush out.",
    image: "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=600",
    features: [
      "Breed-standard body haircut",
      "Sanitary trim & paw pads trim",
      "Gland expression (on request)",
      "Luxury styling & bow/bandana"
    ],
    inclusions: [
      "All Premium Wash services",
      "Full body scissor & clipper haircut",
      "Paw pad shave & trim",
      "Sanitary area tidying",
      "Premium bandana or bow accessory"
    ]
  },
  {
    id: "nail-trimming",
    name: "Nail Trimming & Filing",
    category: "Wellness",
    price: 10,
    duration: "10 mins",
    rating: 4.7,
    reviewsCount: 98,
    tagline: "Claw clipping & rounded grinder filing to prevent scratches.",
    description: "Keep your dog's paws healthy and your floors scratch-free. Our groomers carefully clip claws to the appropriate length and finish with an electric diamond file to smooth out all sharp edges.",
    image: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=600",
    features: [
      "Precision claw clipping",
      "Grinder smooth filing",
      "Paw balm massage"
    ],
    inclusions: [
      "Nail clip to quick limit",
      "Rotary grinder smoothing",
      "Soothing organic paw butter"
    ]
  },
  {
    id: "ear-cleaning",
    name: "Ear Cleaning & Plucking",
    category: "Wellness",
    price: 10,
    duration: "10 mins",
    rating: 4.6,
    reviewsCount: 65,
    tagline: "Removal of excess hair and ear wax sanitization flush.",
    description: "Reduces the risk of ear infections and canal odor. We pluck excess hair (if required by breed) and flush with natural cucumber-extract cleansing washes to dissolve built-up wax and dirt.",
    image: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=600",
    features: [
      "Excess ear hair plucking",
      "Soothing wax flush",
      "Dry cotton sanitize wipe"
    ],
    inclusions: [
      "Gromer ear plucking",
      "Wax-dissolving natural drops",
      "Gentle cotton swab cleanse"
    ]
  },
  {
    id: "flea-treatment",
    name: "Flea & Tick Treatment",
    category: "Therapy",
    price: 20,
    duration: "30 mins",
    rating: 4.8,
    reviewsCount: 112,
    tagline: "Medicated flea bath + 30-day topical tick repellent.",
    description: "Complete eradication of fleas, ticks, and lice. We use a specialty EPA-approved citrus oil medicated shampoo that kills pests on contact while soothing inflamed skin from insect bites.",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600",
    features: [
      "Medicated contact pest bath",
      "Pest comb inspection",
      "Topical preventative application"
    ],
    inclusions: [
      "Medicated flea & tick wash",
      "Full body tick check & removal",
      "30-day preventative oil drop"
    ]
  },
  {
    id: "teeth-cleaning",
    name: "Teeth Cleaning & Breath Spray",
    category: "Wellness",
    price: 12,
    duration: "15 mins",
    rating: 4.5,
    reviewsCount: 84,
    tagline: "Enzyme tooth paste brushing and plaque tartar scraping.",
    description: "Freshens bad dog breath and promotes periodontal health. We brush with dog-safe enzymatic poultry paste and apply plaque-inhibiting sprays.",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=600",
    features: [
      "Enzymatic poultry toothpaste",
      "Soft double-sided brushing",
      "Freshening breath mist spray"
    ],
    inclusions: [
      "Toothpaste application",
      "Full brush sweep",
      "Tartar-control plaque spray"
    ]
  },
  {
    id: "spa-therapy",
    name: "Spa Therapy & Hydromassage",
    category: "Therapy",
    price: 40,
    duration: "45 mins",
    rating: 4.9,
    reviewsCount: 176,
    tagline: "Warm mud pack, hydrotherapy bubbles, and lavender aromatherapy.",
    description: "Treat your pet to the ultimate relaxation. Includes a warm mineral mud pack wrap to detoxify skin, bubble hydrotherapy jet soak to relieve joint fatigue, and a relaxing head-to-paw massage with lavender oils.",
    image: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=600",
    features: [
      "Warm mineral mud pack wrap",
      "Bubble hydrotherapy jet bath",
      "Lavender aromatherapy massage"
    ],
    inclusions: [
      "Mineral skin mud pack",
      "Jacuzzi hydrotherapy soak",
      "Essential lavender oil massage",
      "Fluffy heated towel wrap"
    ]
  }
];

export const PACKAGES = [
  {
    id: "pack-puppy",
    name: "Puppy's First Spa",
    price: 25,
    duration: "40 mins",
    popular: false,
    badge: "Gentle Care",
    features: [
      "Gentle tearless baby-shampoo",
      "Towel wrap & low-temp dry",
      "Nail clip & ear wipe",
      "Teeth wipe & breath spray",
      "Scented powder finish"
    ]
  },
  {
    id: "pack-royal",
    name: "Royal Canine Groom",
    price: 65,
    duration: "80 mins",
    popular: true,
    badge: "Best Seller",
    features: [
      "Full Scissor-style haircut",
      "Organic shampoo & conditioner",
      "Paws pad shave & nail filing",
      "Teeth brushing & minty spray",
      "Lavender skin massage pack",
      "Luxury bandana & treats"
    ]
  },
  {
    id: "pack-shed",
    name: "Undercoat Deshed Reset",
    price: 45,
    duration: "50 mins",
    popular: false,
    badge: "Blowout Specialist",
    features: [
      "Furminator blowout wash",
      "High-velocity undercoat blast",
      "Carding brush & rake grooming",
      "Nail clipping & paw balm",
      "Shed-stop finishing spray"
    ]
  }
];

export const OFFERS = [
  {
    id: "off-paws",
    badge: "NEW PET SPECIAL",
    code: "FIRSTPAW15",
    title: "15% OFF Your First Grooming",
    description: "Welcome to the spa! Save 15% flat rate on any Grooming or Spa Therapy package.",
    validUntil: "Dec 31, 2026",
    type: "percentage",
    value: 15,
    minAmount: 20
  },
  {
    id: "off-midweek",
    badge: "MIDWEEK DISCOUNT",
    code: "TEALWED",
    title: "Flat $5 OFF on Wednesday Baths",
    description: "Beat the weekend rush! Schedule any wash on Wednesday to claim your discount.",
    validUntil: "Oct 15, 2026",
    type: "flat",
    value: 5,
    minAmount: 15
  }
];

export const REVIEWS = [
  {
    id: 1,
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    date: "2026-07-10",
    service: "Full Grooming",
    vehicle: "Golden Retriever (Max)",
    comment: "Max is usually very anxious during blow drying, but Kabir handled him with so much care! His summer teddy haircut is perfect and he came home smelling amazing!"
  },
  {
    id: 2,
    name: "Rahul Verma",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    date: "2026-07-12",
    service: "Premium Wash & Deshed",
    vehicle: "German Shepherd (Rocky)",
    comment: "Absolute deshedding wizardry! The amount of loose undercoat hair they blew out of Rocky is unbelievable. Extremely professional, clean setup inside the mobile van."
  },
  {
    id: 3,
    name: "Anita Desai",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
    rating: 4,
    date: "2026-07-14",
    service: "Spa Therapy",
    vehicle: "Shih Tzu (Bella)",
    comment: "Bella loved the bubble hydromassage! Her coat is so shiny and soft now. Docked one star because they arrived 15 mins late due to traffic, but they notified me beforehand."
  }
];

export const FAQS = [
  {
    q: "Do you need access to our home water faucet or electricity hookup?",
    a: "No! Our customized mobile grooming vans are completely self-sufficient. They are equipped with 300-liter purified warm water tanks, silent generator systems, and commercial-grade pet dryers."
  },
  {
    q: "How long does a full grooming session typically take?",
    a: "A standard wash takes around 20-35 minutes. A Full Grooming session (with haircut and styling) takes between 60 to 90 minutes depending on your dog's size, coat condition, and cooperativeness."
  },
  {
    q: "Do you groom aggressive or extremely anxious dogs?",
    a: "Our groomers are certified in low-stress handling methods. For extremely anxious pets, we take frequent breaks and use calming pheromones. If a pet poses a safety hazard, we will pause and discuss options with you."
  }
];

export const MOCK_BOOKINGS = [
  {
    id: "BK-7164",
    package: "Full Grooming - Royal Canine",
    status: "Upcoming",
    date: "2026-07-22",
    time: "10:30 AM - 11:30 AM",
    vehicle: "Golden Retriever (Max)",
    location: "Palasia Main Rd, Scheme 54, Indore",
    technician: "Kabir Mehta",
    price: 65,
    eta: "18 mins",
    timeline: [
      { status: "Grooming Appt Scheduled", time: "09:00 AM", active: true },
      { status: "Groomer Assigned", time: "11:00 AM", active: true },
      { status: "Van Dispatched (En Route)", time: "12:15 PM", active: true },
      { status: "Arrival & Set Up", time: "Pending", active: false },
      { status: "Grooming & Bath", time: "Pending", active: false },
      { status: "Showroom Return", time: "Pending", active: false }
    ]
  },
  {
    id: "BK-3021",
    package: "Basic Wash & Nail Grind",
    status: "Completed",
    date: "2026-07-10",
    time: "02:30 PM - 03:00 PM",
    vehicle: "Pug (Leo)",
    location: "Vijay Nagar Square, Indore",
    technician: "Priya Nair",
    price: 25,
    eta: "0 mins",
    timeline: []
  }
];

export const MOCK_PETS = [
  { id: "pet-max", name: "Max", breed: "Golden Retriever", age: "2 years", weight: "32 kg", avatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=100" },
  { id: "pet-leo", name: "Leo", breed: "Pug", age: "4 years", weight: "8 kg", avatar: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&q=80&w=100" }
];

export const getServices = () => Promise.resolve(SERVICES);
export const getServiceById = (id) => Promise.resolve(SERVICES.find(s => s.id === id));
export const getPackages = () => Promise.resolve(PACKAGES);
export const getBookings = () => Promise.resolve(MOCK_BOOKINGS);
export const getTechnician = () => Promise.resolve({
  name: "Kabir Mehta",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  rating: 4.95,
  completedJobs: 412,
  phone: "+91 98765 09876",
  vehicleInfo: "Teal Groomer Van (MP09AB5678)"
});
