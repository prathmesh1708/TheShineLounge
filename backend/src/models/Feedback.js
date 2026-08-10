const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Customer'
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: [
        'General Feedback',
        'Help & Support Request',
        'Service Quality / Experience',
        'Bug or Technical Issue',
        'Feature Suggestion'
      ],
      default: 'General Feedback'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    message: {
      type: String,
      required: [true, 'Message or feedback is required'],
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['Pending', 'Replied', 'Resolved', 'Archived'],
      default: 'Pending'
    },
    replyMessage: {
      type: String,
      trim: true,
      default: ''
    },
    repliedBy: {
      type: String,
      trim: true,
      default: ''
    },
    repliedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
