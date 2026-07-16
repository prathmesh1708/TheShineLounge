const CafeModel = require('./cafe.model');

// Mock in-memory database for testing
const bookingsDb = [];

const fetchBookings = async () => {
  return bookingsDb;
};

const addBooking = async (bookingData) => {
  const booking = new CafeModel(bookingData);
  bookingsDb.push(booking);
  return booking;
};

const fetchServiceDetails = async () => {
  return {
    name: 'Cafe Service',
    description: 'Professional cafe services and booking platform.',
    isActive: true
  };
};

module.exports = {
  fetchBookings,
  addBooking,
  fetchServiceDetails
};
