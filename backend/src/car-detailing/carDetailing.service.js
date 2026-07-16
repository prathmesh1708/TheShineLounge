const CarDetailingModel = require('./carDetailing.model');

// Mock in-memory database for testing
const bookingsDb = [];

const fetchBookings = async () => {
  return bookingsDb;
};

const addBooking = async (bookingData) => {
  const booking = new CarDetailingModel(bookingData);
  bookingsDb.push(booking);
  return booking;
};

const fetchServiceDetails = async () => {
  return {
    name: 'CarDetailing Service',
    description: 'Professional car-detailing services and booking platform.',
    isActive: true
  };
};

module.exports = {
  fetchBookings,
  addBooking,
  fetchServiceDetails
};
