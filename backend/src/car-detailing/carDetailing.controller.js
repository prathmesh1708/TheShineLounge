const carDetailingService = require('./carDetailing.service');
const { formatResponse } = require('../common/utils/helpers');

const getBookings = async (req, res, next) => {
  try {
    const bookings = await carDetailingService.fetchBookings();
    res.json(formatResponse(true, 'Fetched CarDetailing bookings successfully', bookings));
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const newBooking = await carDetailingService.addBooking(req.body);
    res.status(201).json(formatResponse(true, 'Created CarDetailing booking successfully', newBooking));
  } catch (error) {
    next(error);
  }
};

const getServiceDetails = async (req, res, next) => {
  try {
    const details = await carDetailingService.fetchServiceDetails();
    res.json(formatResponse(true, 'Fetched CarDetailing details successfully', details));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  createBooking,
  getServiceDetails
};
