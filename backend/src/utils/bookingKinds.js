// What kind of thing a row in `bookings` actually is.
//
// The collection holds three different things behind one shape: counter sales
// (OFS-*), bookings a customer made themselves, and membership wash redemptions
// (WASH-*). A redemption is somebody spending a pass they already bought -- it
// is usage, not a sale -- so anything counting or listing sales has to exclude
// it. Mirrors the frontend's isWashRedemptionRecord so both ends agree.
const isRedemptionRecord = (b) => {
  if (!b) return false;
  const id = String(b.bookingId || b.id || b._id || '');
  const pkg = String(b.packageName || b.plan || b.planName || '').toLowerCase();
  const payment = String(b.paymentMode || b.paymentMethod || '').toLowerCase();
  const notes = String(b.notes || '').toLowerCase();

  return (
    id.startsWith('WASH-') ||
    b.saleType === 'redemption' ||
    pkg.includes('ground wash') ||
    pkg.includes('redeemed') ||
    payment === 'membership' ||
    payment === 'membership pass' ||
    notes.includes('wash performed') ||
    notes.includes('wash completed')
  );
};

// A real transaction: rung up at the counter, or booked by the customer.
const isSaleOrCustomerBooking = (b) => Boolean(b) && !isRedemptionRecord(b);

module.exports = { isRedemptionRecord, isSaleOrCustomerBooking };
