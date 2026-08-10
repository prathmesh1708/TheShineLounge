// Plate numbers arrive from three places that never agree on formatting: a
// customer typing into the app ("mh 01 ab 1234"), staff typing at the counter
// ("MH-01-AB-1234") and an ANPR camera ("MH01AB1234", occasionally with a
// province prefix or a misread character). Matching raw strings would miss the
// majority of real arrivals, so everything is compared through here instead.

// Characters an OCR engine confuses for one another. Used only to build a
// lookup key for *candidate* matching — never to decide a match on its own.
const CONFUSABLE = {
  O: '0', Q: '0', D: '0',
  I: '1', L: '1',
  Z: '2',
  S: '5',
  G: '6',
  T: '7',
  B: '8',
  A: '4'
};

// Values seeded into the database as placeholders. They are not plates and must
// never match a real vehicle.
const PLACEHOLDERS = new Set([
  'REGPENDING',
  'NA',
  'NIL',
  'NONE',
  'UNKNOWN',
  'TBD',
  'XXXX',
  '00000000'
]);

const MIN_PLATE_LENGTH = 4;
const MAX_PLATE_LENGTH = 16;

// Strip everything that is not a letter or digit and uppercase the rest. Handles
// non-Latin scripts (the parking system emits Chinese province characters) by
// dropping them — the alphanumeric tail is what identifies the vehicle.
const normalizePlate = (raw) => {
  if (raw === null || raw === undefined) return '';
  // Only strings and finite numbers are plates. Coercing an object would turn
  // "[object Object]" into the perfectly plausible-looking plate OBJECTOBJECT.
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? String(raw) : '';
  }
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};

// A plate we are willing to act on automatically. Anything shorter than four
// characters is almost certainly a partial read, and anything past sixteen is a
// concatenation bug upstream.
const isUsablePlate = (raw) => {
  const plate = normalizePlate(raw);
  if (plate.length < MIN_PLATE_LENGTH) return false;
  if (plate.length > MAX_PLATE_LENGTH) return false;
  if (PLACEHOLDERS.has(plate)) return false;
  // A plate with no digit at all is usually a word that leaked into the field.
  if (!/\d/.test(plate)) return false;
  return true;
};

// Collapses OCR-confusable characters onto a single representative so that
// "MH01AB1234" and "MHO1AB1Z34" share a key. Two plates with the same
// confusable key are *candidates*; they are not the same vehicle.
const confusableKey = (raw) => {
  const plate = normalizePlate(raw);
  let key = '';
  for (const ch of plate) {
    key += CONFUSABLE[ch] || ch;
  }
  return key;
};

const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
};

// 1 means identical after normalisation, 0 means nothing in common.
const plateSimilarity = (a, b) => {
  const x = normalizePlate(a);
  const y = normalizePlate(b);
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  if (x === y) return 1;
  const distance = levenshtein(x, y);
  return 1 - distance / Math.max(x.length, y.length);
};

// The only function callers should use to decide whether two plates are the
// same vehicle. `confidence` drives what the system is allowed to do with it:
//
//   exact      — normalised forms are identical. Safe to act on automatically.
//   confusable — differ only by characters OCR routinely swaps. Needs review.
//   similar    — one edit apart. Needs review.
//   none       — different vehicles.
//
// Anything other than `exact` must be routed to a human before money or a
// membership wash is touched.
const comparePlates = (a, b) => {
  const left = normalizePlate(a);
  const right = normalizePlate(b);

  if (!left || !right) {
    return { match: false, confidence: 'none', score: 0 };
  }
  if (left === right) {
    return { match: true, confidence: 'exact', score: 1 };
  }
  if (confusableKey(left) === confusableKey(right)) {
    return { match: true, confidence: 'confusable', score: plateSimilarity(left, right) };
  }

  const score = plateSimilarity(left, right);
  // One substitution in a plate of six or more characters still leaves a very
  // high score, so require both a tight edit distance and a long enough plate.
  if (levenshtein(left, right) === 1 && Math.min(left.length, right.length) >= 6) {
    return { match: true, confidence: 'similar', score };
  }

  return { match: false, confidence: 'none', score };
};

// Formats a normalised plate back into something readable for staff screens and
// notifications. Best-effort only — the stored value stays normalised.
const formatPlate = (raw) => {
  const plate = normalizePlate(raw);
  if (!plate) return '';
  // Indian format: 2 letters, 1-2 digits, 1-3 letters, 4 digits.
  const indian = plate.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{4})$/);
  if (indian) return `${indian[1]} ${indian[2]} ${indian[3]} ${indian[4]}`;
  return plate;
};

module.exports = {
  CONFUSABLE,
  PLACEHOLDERS,
  MIN_PLATE_LENGTH,
  MAX_PLATE_LENGTH,
  normalizePlate,
  isUsablePlate,
  confusableKey,
  plateSimilarity,
  comparePlates,
  formatPlate,
  levenshtein
};
