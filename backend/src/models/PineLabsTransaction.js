const mongoose = require('mongoose');

// One row per card payment ATTEMPT on a Pine Labs terminal — not per sale.
//
// A declined card never becomes an invoice or an offline sale, so if the
// attempt were only recorded on those documents it would leave no trace at
// all: the staff member would be the only record that the customer's card was
// refused. Keeping attempts in their own collection means every tap is
// accounted for, and the invoice/sale is linked in afterwards (sourceId) once
// the money is actually approved.
const pineLabsTransactionSchema = new mongoose.Schema(
  {
    // Our reference, sent to Pine Labs as the billing/transaction number and
    // quoted back by staff when reconciling with the Pine Labs settlement file.
    txnRef: { type: String, required: true, unique: true, index: true },

    // Pine Labs' handle for the same attempt. Needed for every status poll and
    // for the cancel call, so a crashed browser can still be resumed.
    plutusTxnRefId: { type: String, default: '', index: true },

    // Which counter's machine the bill was pushed to.
    departmentKey: { type: String, default: '' },
    department: { type: String, default: '' },
    terminalImei: { type: String, default: '' },

    // Rupees, as billed. Pine Labs is spoken to in paise; the conversion lives
    // in the provider so nothing else has to remember it.
    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled', 'timeout'],
      default: 'pending',
      index: true
    },

    // What this attempt was paying for. sourceId stays empty until the
    // invoice/sale is written, which only happens on approval.
    source: { type: String, enum: ['invoice', 'offline-sale'], required: true },
    sourceId: { type: String, default: '', index: true },

    staffId: { type: String, default: '' },
    staffName: { type: String, default: '' },
    customerName: { type: String, default: '' },
    phone: { type: String, default: '' },
    vehicleNo: { type: String, default: '' },

    // Card details Pine Labs returns on approval — printed on the receipt and
    // used to match a chargeback back to a sale.
    cardType: { type: String, default: '' },
    cardLast4: { type: String, default: '' },
    approvalCode: { type: String, default: '' },
    rrn: { type: String, default: '' },
    acquirerName: { type: String, default: '' },

    failureReason: { type: String, default: '' },
    // The terminal's own reply, kept verbatim for disputes with Pine Labs.
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },

    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// "What happened at the car wash counter today" and the staff's own attempt
// history are the two ways this collection is read.
pineLabsTransactionSchema.index({ createdAt: -1 });
pineLabsTransactionSchema.index({ departmentKey: 1, createdAt: -1 });

module.exports = mongoose.model('PineLabsTransaction', pineLabsTransactionSchema);
