const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizePlate,
  isUsablePlate,
  confusableKey,
  comparePlates,
  plateSimilarity,
  formatPlate,
  levenshtein
} = require('../src/utils/plateNormalizer');

test('normalizePlate strips separators and uppercases', () => {
  assert.equal(normalizePlate('mh 01 ab 1234'), 'MH01AB1234');
  assert.equal(normalizePlate('MH-01-AB-1234'), 'MH01AB1234');
  assert.equal(normalizePlate('MH.01.AB.1234'), 'MH01AB1234');
  assert.equal(normalizePlate('  MH01AB1234  '), 'MH01AB1234');
  assert.equal(normalizePlate('MH_01/AB#1234'), 'MH01AB1234');
});

test('normalizePlate survives non-string and empty input', () => {
  assert.equal(normalizePlate(null), '');
  assert.equal(normalizePlate(undefined), '');
  assert.equal(normalizePlate(''), '');
  assert.equal(normalizePlate('   '), '');
  assert.equal(normalizePlate(12345), '12345');
  assert.equal(normalizePlate({}), '');
  assert.equal(normalizePlate([]), '');
});

test('normalizePlate drops non-Latin script but keeps the alphanumeric tail', () => {
  // The parking system emits Chinese province characters ahead of the plate.
  assert.equal(normalizePlate('粤B34943'), 'B34943');
  assert.equal(normalizePlate('Guangdong B34943'), 'GUANGDONGB34943');
  assert.equal(normalizePlate('入口'), '');
  assert.equal(normalizePlate('MH01AB1234🚗'), 'MH01AB1234');
});

test('normalizePlate normalises full-width characters', () => {
  assert.equal(normalizePlate('ＭＨ０１ＡＢ１２３４'), 'MH01AB1234');
});

test('isUsablePlate rejects partial reads, placeholders and letter-only values', () => {
  assert.equal(isUsablePlate('MH01AB1234'), true);
  assert.equal(isUsablePlate('B98255'), true);

  assert.equal(isUsablePlate(''), false);
  assert.equal(isUsablePlate('AB1'), false, 'too short');
  assert.equal(isUsablePlate('A'.repeat(20) + '1'), false, 'too long');
  assert.equal(isUsablePlate('REG-PENDING'), false, 'seeded placeholder');
  assert.equal(isUsablePlate('UNKNOWN'), false);
  assert.equal(isUsablePlate('N/A'), false);
  assert.equal(isUsablePlate('ABCDEF'), false, 'no digits');
  assert.equal(isUsablePlate('入口'), false);
});

test('confusableKey collapses characters OCR routinely swaps', () => {
  assert.equal(confusableKey('MH01AB1234'), confusableKey('MHO1AB1234'));
  assert.equal(confusableKey('B8'), confusableKey('88'));
  assert.equal(confusableKey('SO'), confusableKey('50'));
  assert.notEqual(confusableKey('MH01AB1234'), confusableKey('MH01AB1235'));
});

test('comparePlates flags identical plates as exact', () => {
  const r = comparePlates('MH 01 AB 1234', 'mh01ab1234');
  assert.equal(r.match, true);
  assert.equal(r.confidence, 'exact');
  assert.equal(r.score, 1);
});

test('comparePlates flags OCR-confusable plates as needing review, not exact', () => {
  const r = comparePlates('MH01AB1234', 'MHO1AB1Z34');
  assert.equal(r.match, true);
  assert.equal(r.confidence, 'confusable');
  assert.notEqual(r.confidence, 'exact', 'must never auto-consume on a fuzzy match');
});

test('comparePlates flags a single-character difference as similar', () => {
  const r = comparePlates('MH01AB1234', 'MH01AB1239');
  assert.equal(r.match, true);
  assert.equal(r.confidence, 'similar');
});

test('comparePlates does not treat short plates as similar', () => {
  // Two genuinely different short plates are one edit apart far too often.
  const r = comparePlates('AB123', 'AB124');
  assert.equal(r.confidence, 'none');
  assert.equal(r.match, false);
});

test('comparePlates rejects unrelated and empty plates', () => {
  assert.equal(comparePlates('MH01AB1234', 'DL09XY9999').match, false);
  assert.equal(comparePlates('', 'MH01AB1234').match, false);
  assert.equal(comparePlates('MH01AB1234', null).match, false);
  assert.equal(comparePlates(null, undefined).match, false);
});

test('comparePlates does not match a plate that is merely a prefix of another', () => {
  const r = comparePlates('MH01AB123', 'MH01AB1234');
  // One insertion — deliberately routed to review rather than auto-matched.
  assert.notEqual(r.confidence, 'exact');
});

test('plateSimilarity is bounded and symmetric', () => {
  assert.equal(plateSimilarity('MH01AB1234', 'MH01AB1234'), 1);
  assert.equal(plateSimilarity('', ''), 1);
  assert.equal(plateSimilarity('ABC1', ''), 0);
  const a = plateSimilarity('MH01AB1234', 'DL09XY9999');
  const b = plateSimilarity('DL09XY9999', 'MH01AB1234');
  assert.equal(a, b);
  assert.ok(a >= 0 && a <= 1);
});

test('levenshtein handles the boundary cases', () => {
  assert.equal(levenshtein('', ''), 0);
  assert.equal(levenshtein('abc', ''), 3);
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('abc', 'abc'), 0);
  assert.equal(levenshtein('kitten', 'sitting'), 3);
});

test('formatPlate renders Indian plates readably and passes others through', () => {
  assert.equal(formatPlate('MH01AB1234'), 'MH 01 AB 1234');
  assert.equal(formatPlate('mh1a1234'), 'MH 1 A 1234');
  assert.equal(formatPlate('B98255'), 'B98255');
  assert.equal(formatPlate(''), '');
  assert.equal(formatPlate(null), '');
});
