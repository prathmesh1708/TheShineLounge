const dogWashService = require('./dogWash.service');
const { formatResponse } = require('../common/utils/helpers');

const getBookings = async (req, res, next) => {
  try {
    const bookings = await dogWashService.fetchBookings();
    res.json(formatResponse(true, 'Fetched DogWash bookings successfully', bookings));
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const newBooking = await dogWashService.addBooking(req.body);
    res.status(201).json(formatResponse(true, 'Created DogWash booking successfully', newBooking));
  } catch (error) {
    next(error);
  }
};

const getServiceDetails = async (req, res, next) => {
  try {
    const details = await dogWashService.fetchServiceDetails();
    res.json(formatResponse(true, 'Fetched DogWash details successfully', details));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  createBooking,
  getServiceDetails
};
