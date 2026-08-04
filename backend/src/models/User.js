const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
