const mongoose = require('mongoose');

// Day-to-day running costs that are not tied to any one service: tea, cleaning
// supplies, a repair, a courier. Its own collection because an expense is not a
// negative sale -- mixing them into bookings would corrupt every revenue figure
// the dashboards compute.
const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'An expense needs a title'],
      trim: true
    },
    // Free text rather than an enum: the shop will spend money on things nobody
    // anticipated, and a rejected save at the counter helps no one.
    category: {
      type: String,
      default: 'General',
      trim: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'An expense needs an amount'],
      min: [0, 'Amount cannot be negative']
    },
    // The date the money was actually spent, which is not always the day it got
    // typed in. Every total groups on this, never on createdAt.
    spentOn: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    paidBy: { type: String, default: '', trim: true },
    paymentMode: { type: String, default: 'Cash', trim: true },
    // Optional: lets a cost be attributed to one hub when it clearly belongs to
    // one. Blank means a shared overhead.
    serviceKey: { type: String, default: '', trim: true, index: true },
    vendor: { type: String, default: '', trim: true },
    billRef: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    recordedBy: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

expenseSchema.index({ spentOn: -1, isDeleted: 1 });

module.exports = mongoose.model('Expense', expenseSchema, 'expenses');
