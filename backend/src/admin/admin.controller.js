const adminService = require('./admin.service');
const { formatResponse } = require('../common/utils/helpers');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.fetchDashboardStats();
    res.json(formatResponse(true, 'Dashboard stats fetched successfully', stats));
  } catch (error) {
    next(error);
  }
};

const manageSystemData = async (req, res, next) => {
  try {
    const status = await adminService.runSystemMaintenance();
    res.json(formatResponse(true, 'System maintenance completed', status));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  manageSystemData
};
