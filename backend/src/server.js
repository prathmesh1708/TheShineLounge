const express = require('express');
const cors = require('cors');
const { PORT } = require('./common/config/env');
const connectDB = require('./common/config/db');
const logger = require('./common/middleware/logger');
const errorHandler = require('./common/middleware/errorHandler');

// Import Service Indexes
const cafe = require('./cafe');
const driveThroughCafe = require('./drive-through-cafe');
const carWash = require('./car-wash');
const carDetailing = require('./car-detailing');
const dogWash = require('./dog-wash');
const salon = require('./salon');

// Import Staff Modules
const cafeStaff = require('./staff/cafe-staff');
const driveThroughCafeStaff = require('./staff/drive-through-cafe-staff');
const carWashStaff = require('./staff/car-wash-staff');
const carDetailingStaff = require('./staff/car-detailing-staff');
const dogWashStaff = require('./staff/dog-wash-staff');
const salonStaff = require('./staff/salon-staff');

// Import Admin Module
const admin = require('./admin');

const app = express();

// Connect to Database
connectDB();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Mount Service Routes
app.use('/api/cafe', cafe.routes);
app.use('/api/drive-through-cafe', driveThroughCafe.routes);
app.use('/api/car-wash', carWash.routes);
app.use('/api/car-detailing', carDetailing.routes);
app.use('/api/dog-wash', dogWash.routes);
app.use('/api/salon', salon.routes);

// Mount Staff Routes
app.use('/api/staff/cafe', cafeStaff.routes);
app.use('/api/staff/drive-through-cafe', driveThroughCafeStaff.routes);
app.use('/api/staff/car-wash', carWashStaff.routes);
app.use('/api/staff/car-detailing', carDetailingStaff.routes);
app.use('/api/staff/dog-wash', dogWashStaff.routes);
app.use('/api/staff/salon', salonStaff.routes);

// Mount Admin Routes
app.use('/api/admin', admin.routes);


// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Multi-Service Booking Platform API',
    services: [
      'cafe',
      'drive-through-cafe',
      'car-wash',
      'car-detailing',
      'dog-wash',
      'salon'
    ]
  });
});

// Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
