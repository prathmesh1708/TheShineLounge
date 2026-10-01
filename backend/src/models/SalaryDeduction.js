const mongoose = require('mongoose');

const DEDUCTION_CATEGORIES = [
  'Late Arrival',
  'Absence',
  'Damage / Loss',
  'Advance Recovery',
  'Uniform',
  'Disciplinary',
  'Other'
];

// One document per deduction. Never deleted: a mistaken deduction is reversed,
// which keeps both the original entry and the correction on record.
const salaryDeductionSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    statement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStatement',
      required: true
    },
    payMonth: {
      type: String,
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'payMonth must be YYYY-MM']
    },
    staffName: { type: String, default: '' },
    serviceKey: { type: String, default: '' },

    amount: { type: Number, required: true, min: 1 },
    category: {
      type: String,
      enum: DEDUCTION_CATEGORIES,
      default: 'Other'
    },
    reason: {
      type: String,
      required: [true, 'Deduction reason is required'],
      trim: true,
      maxlength: 500
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdByName: { type: String, default: '' },

    status: {
      type: String,
      enum: ['active', 'reversed'],
      default: 'active'
    },
    reversedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    reversedByName: { type: String, default: '' },
    reversedAt: { type: Date, default: null },
    reversalReason: { type: String, default: '', trim: true, maxlength: 500 }
  },
  {
    timestamps: true
  }
);

salaryDeductionSchema.index({ staff: 1, payMonth: 1, createdAt: -1 });

const SalaryDeduction = mongoose.model('SalaryDeduction', salaryDeductionSchema, 'salary_deductions');
SalaryDeduction.CATEGORIES = DEDUCTION_CATEGORIES;

module.exports = SalaryDeduction;
