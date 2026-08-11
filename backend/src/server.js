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

// Import Auth, User & Dynamic Service Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Connect to Database
connectDB();

// CORS Configuration — allow Vercel frontend + localhost dev
const allowedOrigins = [
  'https://the-shine-lounge.vercel.app',
  'https://theshinelounge.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any *.vercel.app subdomain
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now; tighten in production
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight OPTIONS for all routes
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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

// Mount Auth, User & Dynamic Service Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload', uploadRoutes);

// Serve uploaded files as static assets
const path = require('path');
app.use('/uploads', express.static(path.resolve(__dirname, '../../frontend/public/uploads')));

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
