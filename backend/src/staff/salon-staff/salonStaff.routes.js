const express = require('express');
const router = express.Router();
const salonStaffController = require('./salonStaff.controller');
const salonStaffMiddleware = require('./salonStaff.middleware');

router.get('/', salonStaffController.listStaff);
router.post('/', salonStaffMiddleware.validateSalonStaff, salonStaffController.createStaff);
router.get('/:id', salonStaffController.getStaff);
router.put('/:id', salonStaffController.updateStaff);
router.delete('/:id', salonStaffController.deleteStaff);

module.exports = router;
