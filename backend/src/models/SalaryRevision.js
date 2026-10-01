const mongoose = require('mongoose');

// History of base salary changes: one document each time monthlySalary changes
const salaryRevisionSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true
    },
    staffName: { type: String, default: '' },
    previousSalary: { type: Number, required: true, min: 0 },
    newSalary: { type: Number, required: true, min: 0 },
    // First pay month the new amount applies to
    effectiveFrom: {
      type: String,
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'effectiveFrom must be YYYY-MM']
    },
    reason: { type: String, default: '', trim: true, maxlength: 500 },
    changedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    changedByName: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SalaryRevision', salaryRevisionSchema, 'salary_revisions');
