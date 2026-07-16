const express = require('express');
const router = express.Router();
const dogWashStaffController = require('./dogWashStaff.controller');
const dogWashStaffMiddleware = require('./dogWashStaff.middleware');

router.get('/', dogWashStaffController.listStaff);
router.post('/', dogWashStaffMiddleware.validateDogWashStaff, dogWashStaffController.createStaff);
router.get('/:id', dogWashStaffController.getStaff);
router.put('/:id', dogWashStaffController.updateStaff);
router.delete('/:id', dogWashStaffController.deleteStaff);

module.exports = router;
