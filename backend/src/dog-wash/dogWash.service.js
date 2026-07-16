const DogWashModel = require('./dogWash.model');

// Mock in-memory database for testing
const bookingsDb = [];

const fetchBookings = async () => {
  return bookingsDb;
};

const addBooking = async (bookingData) => {
  const booking = new DogWashModel(bookingData);
  bookingsDb.push(booking);
  return booking;
};

const fetchServiceDetails = async () => {
  return {
    name: 'DogWash Service',
    description: 'Professional dog-wash services and booking platform.',
    isActive: true
  };
};

module.exports = {
  fetchBookings,
  addBooking,
  fetchServiceDetails
};
