const express = require('express');
const router = express.Router();
const cafeStaffController = require('./cafeStaff.controller');
const cafeStaffMiddleware = require('./cafeStaff.middleware');

router.get('/', cafeStaffController.listStaff);
router.post('/', cafeStaffMiddleware.validateCafeStaff, cafeStaffController.createStaff);
router.get('/:id', cafeStaffController.getStaff);
router.put('/:id', cafeStaffController.updateStaff);
router.delete('/:id', cafeStaffController.deleteStaff);

module.exports = router;
