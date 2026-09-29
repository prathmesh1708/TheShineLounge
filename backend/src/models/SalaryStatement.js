const mongoose = require('mongoose');

// One document per staff member per pay month. Created the first time the
// month is acted on (a deduction or a payment); until then the month is shown
// from the staff member's current monthlySalary. Totals are maintained by
// services/payroll alongside every deduction change and are never sent from the client.
const salaryStatementSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    payMonth: {
      type: String,
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'payMonth must be YYYY-MM']
    },
    staffName: { type: String, default: '' },
    serviceKey: { type: String, default: '', index: true },

    baseSalary: { type: Number, required: true, min: 0 },
    totalDeductions: { type: Number, default: 0, min: 0 },
    netPayable: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['open', 'paid'],
      default: 'open'
    },
    paidAt: { type: Date, default: null },
    paidBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    paidByName: { type: String, default: '' },
    paymentMode: {
      type: String,
      enum: ['', 'Bank Transfer', 'UPI', 'Cash', 'Cheque'],
      default: ''
    },
    paymentNote: { type: String, default: '', trim: true, maxlength: 500 }
  },
  {
    timestamps: true
  }
);

salaryStatementSchema.index({ staff: 1, payMonth: 1 }, { unique: true });
salaryStatementSchema.index({ payMonth: 1, serviceKey: 1 });

module.exports = mongoose.model('SalaryStatement', salaryStatementSchema, 'salary_statements');
