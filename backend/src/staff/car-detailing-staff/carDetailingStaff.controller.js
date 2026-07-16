const carDetailingStaffService = require('./carDetailingStaff.service');
const { formatResponse } = require('../../common/utils/helpers');

const createStaff = async (req, res, next) => {
  try {
    const newStaff = await carDetailingStaffService.addStaff(req.body);
    res.status(201).json(formatResponse(true, 'Staff member added successfully', newStaff));
  } catch (error) {
    next(error);
  }
};

const getStaff = async (req, res, next) => {
  try {
    const staff = await carDetailingStaffService.fetchStaffById(req.params.id);
    if (!staff) {
      return res.status(404).json(formatResponse(false, 'Staff member not found'));
    }
    res.json(formatResponse(true, 'Staff member details fetched successfully', staff));
  } catch (error) {
    next(error);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const updatedStaff = await carDetailingStaffService.modifyStaff(req.params.id, req.body);
    if (!updatedStaff) {
      return res.status(404).json(formatResponse(false, 'Staff member not found'));
    }
    res.json(formatResponse(true, 'Staff member updated successfully', updatedStaff));
  } catch (error) {
    next(error);
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    const deleted = await carDetailingStaffService.removeStaff(req.params.id);
    if (!deleted) {
      return res.status(404).json(formatResponse(false, 'Staff member not found'));
    }
    res.json(formatResponse(true, 'Staff member removed successfully'));
  } catch (error) {
    next(error);
  }
};

const listStaff = async (req, res, next) => {
  try {
    const staffList = await carDetailingStaffService.fetchStaffList();
    res.json(formatResponse(true, 'Staff list fetched successfully', staffList));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff,
  listStaff
};
