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

const getServicesList = async (req, res, next) => {
  try {
    const services = await salonService.fetchServices();
    res.json(formatResponse(true, 'Fetched Salon services successfully', services));
  } catch (error) {
    next(error);
  }
};

const createServiceItem = async (req, res, next) => {
  try {
    const newService = await salonService.addService(req.body);
    res.status(201).json(formatResponse(true, 'Added Salon service successfully', newService));
  } catch (error) {
    next(error);
  }
};

const updateServiceItem = async (req, res, next) => {
  try {
    const updated = await salonService.updateService(req.params.id, req.body);
    res.json(formatResponse(true, 'Updated Salon service successfully', updated));
  } catch (error) {
    next(error);
  }
};

const deleteServiceItem = async (req, res, next) => {
  try {
    const deleted = await salonService.deleteService(req.params.id);
    res.json(formatResponse(true, 'Deleted Salon service successfully', deleted));
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

const getTimeSlots = async (req, res, next) => {
  try {
    const slots = await salonService.fetchTimeSlots();
    res.json(formatResponse(true, 'Fetched Salon time slots successfully', slots));
  } catch (error) {
    next(error);
  }
};

const createTimeSlot = async (req, res, next) => {
  try {
    const newSlot = await salonService.addTimeSlot(req.body);
    res.status(201).json(formatResponse(true, 'Created Salon time slot successfully', newSlot));
  } catch (error) {
    next(error);
  }
};

const updateTimeSlot = async (req, res, next) => {
  try {
    const updated = await salonService.updateTimeSlot(req.params.id, req.body);
    res.json(formatResponse(true, 'Updated Salon time slot successfully', updated));
  } catch (error) {
    next(error);
  }
};

const deleteTimeSlot = async (req, res, next) => {
  try {
    const deleted = await salonService.deleteTimeSlot(req.params.id);
    res.json(formatResponse(true, 'Deleted Salon time slot successfully', deleted));
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
  getServiceDetails,
  getTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot
};


