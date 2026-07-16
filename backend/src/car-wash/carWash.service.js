const CarWashModel = require('./carWash.model');

// Mock in-memory database for testing
const bookingsDb = [];

const fetchBookings = async () => {
  return bookingsDb;
};

const addBooking = async (bookingData) => {
  const booking = new CarWashModel(bookingData);
  bookingsDb.push(booking);
  return booking;
};

const fetchServiceDetails = async () => {
  return {
    name: 'CarWash Service',
    description: 'Professional car-wash services and booking platform.',
    isActive: true
  };
};

module.exports = {
  fetchBookings,
  addBooking,
  fetchServiceDetails
};
