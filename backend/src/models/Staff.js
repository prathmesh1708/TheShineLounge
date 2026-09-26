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
    salary: {
      type: String,
      default: ''
    },
    leaveBalance: {
      type: Number,
      default: 12
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
        completedNaturally: { type: Boolean, default: true }
      }
    ]
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
