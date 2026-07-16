const salonService = require('./salon.service');
const { formatResponse } = require('../common/utils/helpers');

const getBookings = async (req, res, next) => {
  try {
    const bookings = await salonService.fetchBookings();
    res.json(formatResponse(true, 'Fetched Salon bookings successfully', bookings));
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const newBooking = await salonService.addBooking(req.body);
    res.status(201).json(formatResponse(true, 'Created Salon booking successfully', newBooking));
  } catch (error) {
    next(error);
  }
};

const getServiceDetails = async (req, res, next) => {
  try {
    const details = await salonService.fetchServiceDetails();
    res.json(formatResponse(true, 'Fetched Salon details successfully', details));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  createBooking,
  getServiceDetails
};
