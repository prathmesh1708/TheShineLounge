const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Customer full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: false,
      sparse: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    mobile: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      default: 'Mumbai'
    },
    role: {
      type: String,
      default: 'user'
    },
    segment: {
      type: String,
      default: 'Regular Customer'
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    loyaltyPoints: {
      type: Number,
      default: 0
    },
    fcmTokens: {
      type: [String],
      default: []
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
    }
  },
  {
    timestamps: true
  }
);

customerSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

customerSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

customerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Customer', customerSchema, 'customers');
