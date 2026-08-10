const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { normalizePlate } = require('../utils/plateNormalizer');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    mobile: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'user'],
      default: 'user'
    },
    department: {
      type: String,
      enum: [
        'Car Wash',
        'Car Detailing',
        'Detailing',
        'Cafe',
        'Café',
        'Drive-Through Cafe',
        'Drive-Through Café',
        'Drive-Thru Cafe',
        'Drive-Thru Café',
        'Salon',
        "Men's Salon",
        'Dog Wash',
        'Accounts',
        'CRM',
        'Reception',
        'Inventory',
        'Manager',
        'Management',
        ''
      ],
      default: ''
    },
    permissions: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    profileImage: {
      type: String,
      default: ''
    },
    photo: {
      type: String,
      default: ''
    },
    serviceKey: {
      type: String,
      default: ''
    },
    staffRole: {
      type: String,
      default: 'Staff Specialist'
    },
    salary: {
      type: String,
      default: ''
    },
    leaveBalance: {
      type: Number,
      default: 12
    },
    lastLogin: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    branch: {
      type: String,
      default: 'Main Branch'
    },
    city: {
      type: String,
      default: 'Mumbai'
    },
    loyaltyPoints: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    vehicles: [
      {
        plateNumber: { type: String, default: '' },
        // Separators-stripped, uppercased copy of plateNumber. ANPR cameras and
        // customers never format a plate the same way, so every lookup goes
        // through this field. Kept in sync by the pre-save hook below.
        plateNormalized: { type: String, default: '', index: true },
        model: { type: String, default: '' },
        category: { type: String, default: 'Car' },
        isPrimary: { type: Boolean, default: false },
        // How this vehicle came to be on the account, so an unverified plate
        // seen once by a camera is not treated like one the customer entered.
        addedVia: {
          type: String,
          enum: ['self', 'staff', 'admin', 'anpr'],
          default: 'self'
        },
        verifiedAt: { type: Date, default: null }
      }
    ],
    membership: {
      planName: { type: String, default: '' },
      serviceKey: { type: String, default: 'car-wash' },
      startDate: { type: Date, default: null },
      expiryDate: { type: Date, default: null },
      status: {
        type: String,
        enum: ['Active', 'Due for Renewal', 'Expired', 'Suspended', 'None'],
        default: 'None'
      },
      suspensionReason: { type: String, default: '' },
      maxPerDay: { type: Number, default: 1 },
      maxPerMonth: { type: Number, default: 4 },
      coolOffHours: { type: Number, default: 24 },
      boundVehiclesOnly: { type: Boolean, default: true },
      boundVehicles: [{ type: String }],
      // Prepaid wash balance. `unlimited` plans ignore it entirely; leaving it
      // null means the plan is capped by maxPerDay/maxPerMonth alone.
      unlimited: { type: Boolean, default: false },
      washesRemaining: { type: Number, default: null },
      usageCountToday: { type: Number, default: 0 },
      // Site-local period the counters belong to ("2026-08-08" / "2026-08").
      // Storing the key rather than inferring it from lastUsedAt makes the
      // daily and monthly resets exact across DST and midnight boundaries.
      usageDayKey: { type: String, default: '' },
      usageCountMonth: { type: Number, default: 0 },
      usageMonthKey: { type: String, default: '' },
      usagePeriodStart: { type: Date, default: null },
      lastUsedAt: { type: Date, default: null },
      misuseAlerts: [
        {
          date: { type: Date, default: Date.now },
          alertType: { type: String, default: 'Limit Breach' },
          description: { type: String, default: '' }
        }
      ]
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Keep the ANPR lookup key in step with whatever was typed into plateNumber.
// Doing it here rather than at each call site means a vehicle added through the
// admin panel, the customer app or a seed script is matchable straight away.
userSchema.pre('save', function () {
  if (!this.isModified('vehicles')) return;
  for (const vehicle of this.vehicles || []) {
    vehicle.plateNormalized = normalizePlate(vehicle.plateNumber);
  }
});


// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Never return password or isDeleted in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
