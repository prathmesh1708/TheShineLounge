// Allocates the next id in a human-readable sequence (OFS-TSH-01, -02, ...).
//
// These ids used to be derived by COUNTING existing rows, which is only correct
// while nothing is ever deleted. Delete sale #23 out of 24 and the count drops
// to 23, so the next sale claims id 24 -- which already exists. Because the
// booking write is an upsert, that did not even fail loudly: it silently
// overwrote the existing sale, and every subsequent sale overwrote it again.
// The counter could never move past the gap.
//
// Taking the maximum instead means a deleted row leaves a hole in the sequence
// rather than a trap, and ids are never reissued.
const nextSequentialId = async (Model, { field = 'bookingId', prefix, pad = 2 } = {}) => {
  if (!prefix) throw new Error('nextSequentialId requires a prefix');

  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const docs = await Model.find({ [field]: new RegExp(`^${escaped}\\d+$`) })
    .select(field)
    .lean();

  let max = 0;
  for (const doc of docs) {
    const n = parseInt(String(doc[field]).slice(prefix.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }

  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
};

module.exports = { nextSequentialId };
