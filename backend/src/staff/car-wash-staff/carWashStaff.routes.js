const express = require('express');
const router = express.Router();
const carWashStaffController = require('./carWashStaff.controller');
const carWashStaffMiddleware = require('./carWashStaff.middleware');

router.get('/', carWashStaffController.listStaff);
router.post('/', carWashStaffMiddleware.validateCarWashStaff, carWashStaffController.createStaff);
router.get('/:id', carWashStaffController.getStaff);
router.put('/:id', carWashStaffController.updateStaff);
router.delete('/:id', carWashStaffController.deleteStaff);

module.exports = router;
