const carWashService = require('./carWash.service');
const { formatResponse } = require('../common/utils/helpers');

const getBookings = async (req, res, next) => {
  try {
    const bookings = await carWashService.fetchBookings();
    res.json(formatResponse(true, 'Fetched CarWash bookings successfully', bookings));
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const newBooking = await carWashService.addBooking(req.body);
    res.status(201).json(formatResponse(true, 'Created CarWash booking successfully', newBooking));
  } catch (error) {
    next(error);
  }
};

const getServiceDetails = async (req, res, next) => {
  try {
    const details = await carWashService.fetchServiceDetails();
    res.json(formatResponse(true, 'Fetched CarWash details successfully', details));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  createBooking,
  getServiceDetails
};
