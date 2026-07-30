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

const getServicesList = async (req, res, next) => {
  try {
    const services = await carDetailingService.fetchServices();
    res.json(formatResponse(true, 'Fetched CarDetailing treatments successfully', services));
  } catch (error) {
    next(error);
  }
};

const createServiceItem = async (req, res, next) => {
  try {
    const newService = await carDetailingService.addService(req.body);
    res.status(201).json(formatResponse(true, 'Added CarDetailing treatment successfully', newService));
  } catch (error) {
    next(error);
  }
};

const updateServiceItem = async (req, res, next) => {
  try {
    const updated = await carDetailingService.updateService(req.params.id, req.body);
    res.json(formatResponse(true, 'Updated CarDetailing treatment successfully', updated));
  } catch (error) {
    next(error);
  }
};

const deleteServiceItem = async (req, res, next) => {
  try {
    const deleted = await carDetailingService.deleteService(req.params.id);
    res.json(formatResponse(true, 'Deleted CarDetailing treatment successfully', deleted));
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
  getServicesList,
  createServiceItem,
  updateServiceItem,
  deleteServiceItem,
  getServiceDetails
};

