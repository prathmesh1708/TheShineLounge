// One-off repair for membership sales whose date was overwritten by the old
// "Renew" action. That action rewrote the ORIGINAL booking's date/saleDate to
// the renewal day (moving last month's revenue forward) and set it to
// 'Confirmed'. The offlinesales mirror was not touched by it, so it still holds
// the real sale date; this restores the booking from it.
//
//   node src/utils/repairRenewedSaleDates.js          # dry run, changes nothing
//   node src/utils/repairRenewedSaleDates.js --apply  # write the fixes
//
// Uses MONGO_URI from .env, so run it with the production URI to fix production.

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const OfflineSale = require('../models/OfflineSale');

const APPLY = process.argv.includes('--apply');

const toDisplay = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const validityDays = (validity) => {
  const m = String(validity || '').match(/(\d+)\s*day/i);
  if (m) return Number(m[1]);
  if (/year/i.test(validity || '')) return 365;
  return 30;
};

const addDaysIso = (iso, days) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} on db "${mongoose.connection.db.databaseName}"`);

  const candidates = await Booking.find({
    isDeleted: { $ne: true },
    saleType: 'membership',
    bookingId: /^OFS-/
  }).select('bookingId saleDate date status membershipExpiry membershipValidity price customerName').lean();

  const mirrors = await OfflineSale.find({ saleId: { $in: candidates.map((b) => b.bookingId) } })
    .select('saleId saleDate').lean();
  const mirrorDate = new Map(mirrors.map((m) => [m.saleId, m.saleDate]));

  let fixed = 0;
  for (const b of candidates) {
    const original = mirrorDate.get(b.bookingId);
    if (!original || !b.saleDate || original === b.saleDate) continue;
    // Only sales the old renew moved FORWARD; anything else is a deliberate edit.
    if (original > b.saleDate) continue;

    const expiryIso = addDaysIso(original, validityDays(b.membershipValidity));
    const update = {
      saleDate: original,
      date: toDisplay(original),
      membershipExpiry: toDisplay(expiryIso),
      status: 'Completed'
    };
    console.log(`${b.bookingId} ${b.customerName} ₹${b.price}: saleDate ${b.saleDate} -> ${original}, expiry -> ${update.membershipExpiry}, status ${b.status} -> Completed`);
    if (APPLY) await Booking.updateOne({ _id: b._id }, { $set: update });
    fixed += 1;
  }

  console.log(`${fixed} sale(s) ${APPLY ? 'repaired' : 'would be repaired'}.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
