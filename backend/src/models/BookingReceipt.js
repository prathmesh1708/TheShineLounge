const mongoose = require('mongoose');

// The generated receipt PDF, kept out of the booking document on purpose.
//
// These blobs are ~350 KB of base64 each. While they lived on the booking,
// every "list all bookings" query made MongoDB read each one off disk only to
// drop it again: a projection hides a field from the reply, it does not stop
// the document being loaded. A few hundred receipts turned the admin dashboard
// into a multi-hundred-megabyte read and a ~14s wait. One row per booking here
// keeps the booking documents small, so the list query stays cheap however
// many receipts have been generated.
const bookingReceiptSchema = new mongoose.Schema(
  {
    // The owning booking's _id, so the PDF can be fetched in one keyed lookup.
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true
    },
    // Human-facing receipt number, for support lookups.
    bookingId: { type: String, default: '' },
    pdfBase64: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BookingReceipt', bookingReceiptSchema);
