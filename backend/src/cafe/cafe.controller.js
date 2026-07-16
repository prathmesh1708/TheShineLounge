const cafeService = require('./cafe.service');
const { formatResponse } = require('../common/utils/helpers');

const getBookings = async (req, res, next) => {
  try {
    const bookings = await cafeService.fetchBookings();
    res.json(formatResponse(true, 'Fetched Cafe bookings successfully', bookings));
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const newBooking = await cafeService.addBooking(req.body);
    res.status(201).json(formatResponse(true, 'Created Cafe booking successfully', newBooking));
  } catch (error) {
    next(error);
  }
};

const getServiceDetails = async (req, res, next) => {
  try {
    const details = await cafeService.fetchServiceDetails();
    res.json(formatResponse(true, 'Fetched Cafe details successfully', details));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  createBooking,
  getServiceDetails
};
