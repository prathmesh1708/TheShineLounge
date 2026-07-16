const driveThroughCafeService = require('./driveThroughCafe.service');
const { formatResponse } = require('../common/utils/helpers');

const getBookings = async (req, res, next) => {
  try {
    const bookings = await driveThroughCafeService.fetchBookings();
    res.json(formatResponse(true, 'Fetched DriveThroughCafe bookings successfully', bookings));
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const newBooking = await driveThroughCafeService.addBooking(req.body);
    res.status(201).json(formatResponse(true, 'Created DriveThroughCafe booking successfully', newBooking));
  } catch (error) {
    next(error);
  }
};

const getServiceDetails = async (req, res, next) => {
  try {
    const details = await driveThroughCafeService.fetchServiceDetails();
    res.json(formatResponse(true, 'Fetched DriveThroughCafe details successfully', details));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  createBooking,
  getServiceDetails
};
