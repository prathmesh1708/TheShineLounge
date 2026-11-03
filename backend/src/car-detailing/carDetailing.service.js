const CarDetailingModel = require('./carDetailing.model');
const DetailingService = require('../models/DetailingService');

// In-memory database for testing/mock mode
const bookingsDb = [];

const servicesDb = [
  {
    id: "paint-protection",
    name: "Paint Protection Film (PPF)",
    category: "Paint Protection",
    price: 899,
    duration: "480 mins",
    rating: 4.98,
    reviewsCount: 64,
    tagline: "Self-healing thermoplastic urethane shield against rock chips and scratches.",
    description: "Premium Paint Protection Film (PPF) application on high-impact zones. Our military-grade clear bra protects your paint from rock chips, deep scratches, road debris, and winter salt.",
    image: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=800",
    status: "active",
    features: [
      "Full front bumper, hood, and mirror wrap",
      "Self-healing surface technology",
      "10-year manufacturer warranty"
    ],
    inclusions: [
      "Pre-install multi-stage clay bar clean",
      "Micro-fiber PPF care kit"
    ]
  },
  {
    id: "ceramic-coating",
    name: "9H Ceramic Coating",
    category: "Ceramic Coating",
    price: 499,
    duration: "360 mins",
    rating: 5.0,
    reviewsCount: 96,
    tagline: "Ultra-hydrophobic nanotechnology guard for ultimate gloss and protection.",
    description: "We apply a professional-grade 9H liquid ceramic coating. It chemically bonds with your vehicle's factory clear coat, creating a sacrificial glass-like nanoshield. Lasts up to 3 years.",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800",
    status: "active",
    features: [
      "Multi-stage paint correction",
      "9H nano-ceramic liquid compound",
      "Infrared curing process"
    ],
    inclusions: [
      "Glass hydrophobic coating",
      "Wheel face ceramic armor"
    ]
  }
];

const fetchBookings = async () => {
  return bookingsDb;
};

const addBooking = async (bookingData) => {
  const booking = new CarDetailingModel(bookingData);
  bookingsDb.push(booking);
  return booking;
};

const fetchServices = async () => {
  return DetailingService.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean();
};

const addService = async (serviceData) => {
  const slug = String(serviceData.id || serviceData.name || 'detailing-treatment')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const id = serviceData.id || `${slug}-${Date.now()}`;
  return DetailingService.create({ ...serviceData, id, price: Number(serviceData.price) || 0 });
};

const updateService = async (id, serviceData) => {
  const updated = await DetailingService.findOneAndUpdate(
    { id: String(id), isDeleted: { $ne: true } },
    { $set: serviceData },
    { new: true, runValidators: true }
  );
  if (!updated) throw new Error('Service not found');
  return updated;
};

const deleteService = async (id) => {
  const deleted = await DetailingService.findOneAndDelete({ id: String(id) });
  if (!deleted) throw new Error('Service not found');
  return deleted;
};

const fetchServiceDetails = async () => {
  return {
    name: 'CarDetailing Service',
    description: 'Professional car-detailing services and booking platform.',
    isActive: true,
    servicesCount: await DetailingService.countDocuments({ isDeleted: { $ne: true } })
  };
};

module.exports = {
  fetchBookings,
  addBooking,
  fetchServices,
  addService,
  updateService,
  deleteService,
  fetchServiceDetails
};

