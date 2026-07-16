const express = require('express');
const router = express.Router();
const driveThroughCafeStaffController = require('./driveThroughCafeStaff.controller');
const driveThroughCafeStaffMiddleware = require('./driveThroughCafeStaff.middleware');

router.get('/', driveThroughCafeStaffController.listStaff);
router.post('/', driveThroughCafeStaffMiddleware.validateDriveThroughCafeStaff, driveThroughCafeStaffController.createStaff);
router.get('/:id', driveThroughCafeStaffController.getStaff);
router.put('/:id', driveThroughCafeStaffController.updateStaff);
router.delete('/:id', driveThroughCafeStaffController.deleteStaff);

module.exports = router;
