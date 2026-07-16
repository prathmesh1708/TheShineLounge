const DriveThroughCafeModel = require('./driveThroughCafe.model');

// Mock in-memory database for testing
const bookingsDb = [];

const fetchBookings = async () => {
  return bookingsDb;
};

const addBooking = async (bookingData) => {
  const booking = new DriveThroughCafeModel(bookingData);
  bookingsDb.push(booking);
  return booking;
};

const fetchServiceDetails = async () => {
  return {
    name: 'DriveThroughCafe Service',
    description: 'Professional drive-through-cafe services and booking platform.',
    isActive: true
  };
};

module.exports = {
  fetchBookings,
  addBooking,
  fetchServiceDetails
};
