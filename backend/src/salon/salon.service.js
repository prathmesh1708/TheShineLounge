const SalonModel = require('./salon.model');

// In-memory database for testing/mock mode
const bookingsDb = [];

const servicesDb = [
  {
    id: "hair-cut-premium",
    name: "Premium Hair Cut",
    category: "Hair Cut",
    price: 350,
    duration: "30 mins",
    rating: 4.9,
    reviewsCount: 238,
    tagline: "Custom consult, scalp massage wash, precision cut & styled finish.",
    description: "Treat yourself to a custom haircut experience. Includes a personal hair consultation, relaxing deep-clean wash with scalp massage, precision cut, and styling.",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
    status: "active",
    features: ["Personalized style consultation", "Relaxing shampoo & conditioner wash", "Blow dry & premium product styling"],
    inclusions: ["Hair consultation", "Shampoo & scalp massage", "Precision cut", "Blow dry finish"]
  },
  {
    id: "hair-styling-blowout",
    name: "Luxury Blowout & Style",
    category: "Hair Styling",
    price: 450,
    duration: "45 mins",
    rating: 4.8,
    reviewsCount: 165,
    tagline: "Volumizing wash, round-brush blowout, and soft wave styling.",
    description: "Get bouncy, red-carpet ready hair. Includes a nourishing volumizing wash, standard round-brush blowout, and styling.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600",
    status: "active",
    features: ["Deep cleanse & volume mask", "Smooth round-brush blowout"],
    inclusions: ["Volume shampoo prep", "Round-brush blow dry"]
  },
  {
    id: "facial-hydration",
    name: "Ocean Glow Hydrating Facial",
    category: "Facial",
    price: 600,
    duration: "50 mins",
    rating: 4.9,
    reviewsCount: 142,
    tagline: "Micro-exfoliation, marine collagen mask, serum infusion & cold roller massage.",
    description: "Instant skin replenishment for dry or tired skin. Removes dead skin cells through micro-exfoliation and applies collagen masks.",
    image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=600",
    status: "active",
    features: ["Fruit enzyme micro-peel", "Deep hydrating marine collagen mask"],
    inclusions: ["Double cleanse", "Fruit enzyme scrub", "Serum infusion"]
  }
];

const slotsDb = [
  { id: "slot-1", time: "09:00 AM", status: "active", category: "General" },
  { id: "slot-2", time: "09:30 AM", status: "active", category: "General" },
  { id: "slot-3", time: "10:00 AM", status: "active", category: "General" },
  { id: "slot-4", time: "10:30 AM", status: "active", category: "General" },
  { id: "slot-5", time: "11:00 AM", status: "active", category: "General" },
  { id: "slot-6", time: "11:30 AM", status: "active", category: "General" },
  { id: "slot-7", time: "01:00 PM", status: "active", category: "General" },
  { id: "slot-8", time: "01:30 PM", status: "active", category: "General" },
  { id: "slot-9", time: "02:00 PM", status: "active", category: "General" },
  { id: "slot-10", time: "03:00 PM", status: "active", category: "General" },
  { id: "slot-11", time: "04:00 PM", status: "active", category: "General" },
  { id: "slot-12", time: "04:30 PM", status: "active", category: "General" },
  { id: "slot-13", time: "05:00 PM", status: "active", category: "General" },
  { id: "slot-14", time: "06:00 PM", status: "active", category: "General" }
];

const fetchBookings = async () => {
  return bookingsDb;
};

const addBooking = async (bookingData) => {
  const booking = new SalonModel(bookingData);
  bookingsDb.push(booking);
  return booking;
};

const fetchServices = async () => {
  return servicesDb;
};

const addService = async (serviceData) => {
  const item = new SalonModel(serviceData);
  servicesDb.push(item);
  return item;
};

const updateService = async (id, serviceData) => {
  const index = servicesDb.findIndex(s => s.id === id);
  if (index !== -1) {
    servicesDb[index] = { ...servicesDb[index], ...serviceData };
    return servicesDb[index];
  }
  throw new Error('Salon service not found');
};

const deleteService = async (id) => {
  const index = servicesDb.findIndex(s => s.id === id);
  if (index !== -1) {
    const deleted = servicesDb.splice(index, 1);
    return deleted[0];
  }
  throw new Error('Salon service not found');
};

const fetchTimeSlots = async () => {
  return slotsDb;
};

const addTimeSlot = async (slotData) => {
  const newSlot = {
    id: slotData.id || `slot-${Date.now()}`,
    time: slotData.time || '10:00 AM',
    status: slotData.status || 'active',
    category: slotData.category || 'General'
  };
  slotsDb.push(newSlot);
  return newSlot;
};

const updateTimeSlot = async (id, slotData) => {
  const index = slotsDb.findIndex(s => s.id === id || s.time === id);
  if (index !== -1) {
    slotsDb[index] = { ...slotsDb[index], ...slotData };
    return slotsDb[index];
  }
  throw new Error('Salon time slot not found');
};

const deleteTimeSlot = async (id) => {
  const index = slotsDb.findIndex(s => s.id === id || s.time === id);
  if (index !== -1) {
    const deleted = slotsDb.splice(index, 1);
    return deleted[0];
  }
  throw new Error('Salon time slot not found');
};

const fetchServiceDetails = async () => {
  return {
    name: 'Salon Service',
    description: 'Executive salon, grooming, and luxury spa booking platform.',
    isActive: true,
    servicesCount: servicesDb.length,
    slotsCount: slotsDb.length
  };
};

module.exports = {
  fetchBookings,
  addBooking,
  fetchServices,
  addService,
  updateService,
  deleteService,
  fetchTimeSlots,
  addTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  fetchServiceDetails
};


