const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

const {
  getRegisteredVehicles,
  registerVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');

router.get('/', authMiddleware, staffOnly, getRegisteredVehicles);
router.post('/', authMiddleware, staffOnly, registerVehicle);
router.delete('/:id', authMiddleware, staffOnly, deleteVehicle);

module.exports = router;
