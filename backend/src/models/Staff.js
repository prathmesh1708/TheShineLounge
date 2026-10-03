const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Staff full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
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
      default: 'staff'
    },
    department: {
      type: String,
      default: 'Car Wash'
    },
    serviceKey: {
      type: String,
      default: 'car-wash'
    },
    staffRole: {
      type: String,
      default: 'Staff Specialist'
    },
    // Display text only (e.g. "₹35,000 / month"), derived from monthlySalary.
    // Kept so older screens keep rendering; never used for calculations.
    salary: {
      type: String,
      default: ''
    },
    // Source of truth for payroll, in whole rupees. Change it through
    // services/payroll.changeBaseSalary so every change lands in salary_revisions.
    monthlySalary: {
      type: Number,
      default: 0,
      min: 0
    },
    leaveBalance: {
      type: Number,
      default: 0
    },
    permissions: {
      type: [String],
      default: []
    },
    photo: {
      type: String,
      default: ''
    },
    profileImage: {
      type: String,
      default: ''
    },
    branch: {
      type: String,
      default: 'Main Branch'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: null
    },
    // idle -> pending (admin assigned, waiting for staff) -> active (staff started) -> idle
    breakStatus: {
      type: String,
      enum: ['idle', 'pending', 'active', 'completed'],
      default: 'idle'
    },
    // true only while breakStatus === 'active'
    isOnBreak: {
      type: Boolean,
      default: false
    },
    breakStartTime: {
      type: Date,
      default: null
    },
    breakEndTime: {
      type: Date,
      default: null
    },
    breakDuration: {
      type: Number,
      default: 30
    },
    breakReason: {
      type: String,
      default: 'Rest / Lunch Break'
    },
    breakHistory: [
      {
        startTime: { type: Date },
        endTime: { type: Date },
        duration: { type: Number },
        reason: { type: String },
        startedBy: { type: String, default: 'admin' },
        endedBy: { type: String, default: 'system' },
        completedNaturally: { type: Boolean, default: true },
        overtimeSeconds: { type: Number, default: 0 }
      }
    ],
    // Daily break plan set by the admin. The scheduler (services/breakScheduler)
    // turns each enabled slot into a pending break at startTime, site timezone.
    breakSchedule: {
      type: [
        {
          _id: false,
          slot: { type: Number, enum: [1, 2, 3], required: true },
          label: { type: String, trim: true, default: '' },
          startTime: { type: String, default: '' }, // 'HH:mm' 24h, '' = not set
          durationMinutes: { type: Number, min: 1, max: 120, required: true },
          enabled: { type: Boolean, default: true }
        }
      ],
      default: () => [
        { slot: 1, label: 'Break 1', startTime: '', durationMinutes: 30, enabled: true },
        { slot: 2, label: 'Break 2', startTime: '', durationMinutes: 30, enabled: true },
        { slot: 3, label: 'Break 3', startTime: '', durationMinutes: 15, enabled: true }
      ]
    },
    // The BreakLog row behind the current pending/active break, so ending it
    // updates the permanent record rather than guessing which row it was.
    currentBreakLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BreakLog',
      default: null
    },
    currentBreakSlot: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

staffSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

staffSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

staffSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Staff', staffSchema, 'staff');
