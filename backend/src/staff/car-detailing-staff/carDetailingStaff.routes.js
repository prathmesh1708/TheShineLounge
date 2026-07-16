const express = require('express');
const router = express.Router();
const carDetailingStaffController = require('./carDetailingStaff.controller');
const carDetailingStaffMiddleware = require('./carDetailingStaff.middleware');

router.get('/', carDetailingStaffController.listStaff);
router.post('/', carDetailingStaffMiddleware.validateCarDetailingStaff, carDetailingStaffController.createStaff);
router.get('/:id', carDetailingStaffController.getStaff);
router.put('/:id', carDetailingStaffController.updateStaff);
router.delete('/:id', carDetailingStaffController.deleteStaff);

module.exports = router;
