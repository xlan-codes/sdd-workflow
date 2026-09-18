const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { applyDiscount } = require('./discount.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FUTURE = new Date('2099-12-31T23:59:59Z');
const PAST   = new Date('2000-01-01T00:00:00Z');

const CATALOG = {
  PCT10:    { type: 'percent', value: 10,  expiresAt: FUTURE },
  PCT50:    { type: 'percent', value: 50,  expiresAt: FUTURE },
  CAPPED:   { type: 'percent', value: 30,  expiresAt: FUTURE, maxDiscountCents: 500 },
  FIXED200: { type: 'fixed',   value: 200, expiresAt: FUTURE },
  MINORDER: { type: 'fixed',   value: 100, minimumOrderCents: 1000, expiresAt: FUTURE },
  MINALT:   { type: 'fixed',   value: 100, minOrderCents: 1000, expiresAt: FUTURE },
  MINMIN:   { type: 'fixed',   value: 100, minimum: 1000, expiresAt: FUTURE },
  NOEXPIRY: { type: 'fixed',   value: 50  },
  EXPIRED:  { type: 'fixed',   value: 100, expiresAt: PAST },
};

// ---------------------------------------------------------------------------
// Success cases
// ---------------------------------------------------------------------------

describe('applyDiscount — happy path', () => {
  it('applies a percent discount', () => {
    const result = applyDiscount(1000, 'PCT10', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 100, totalCents: 900 });
  });

  it('applies a fixed discount', () => {
    const result = applyDiscount(1000, 'FIXED200', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 200, totalCents: 800 });
  });

  it('is case-insensitive', () => {
    const result = applyDiscount(1000, 'pct10', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 100, totalCents: 900 });
  });

  it('trims whitespace from code', () => {
    const result = applyDiscount(1000, '  PCT10  ', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 100, totalCents: 900 });
  });

  it('accepts a code with no expiry date', () => {
    const result = applyDiscount(1000, 'NOEXPIRY', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 50, totalCents: 950 });
  });

  it('caps percent discount at maxDiscountCents', () => {
    // 30% of 5000 = 1500, but capped at 500
    const result = applyDiscount(5000, 'CAPPED', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 500, totalCents: 4500 });
  });

  it('does not cap percent discount below maxDiscountCents', () => {
    // 30% of 1000 = 300, cap is 500 → no cap applied
    const result = applyDiscount(1000, 'CAPPED', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 300, totalCents: 700 });
  });

  it('caps fixed discount at subtotal so totalCents is never negative', () => {
    const catalog = { BIG: { type: 'fixed', value: 9999 } };
    const result = applyDiscount(100, 'BIG', catalog);
    assert.deepEqual(result, { ok: true, discountCents: 100, totalCents: 0 });
  });

  it('returns zero discount on zero subtotal', () => {
    const result = applyDiscount(0, 'FIXED200', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 0, totalCents: 0 });
  });

  it('rounds percent discount to nearest cent', () => {
    // 10% of 12345 = 1234.5 → round → 1235
    const result = applyDiscount(12345, 'PCT10', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 1235, totalCents: 11110 });
  });

  it('rounds percent discount down when fractional part is below 0.5', () => {
    // 10% of 1001 = 100.1 → round → 100
    const result = applyDiscount(1001, 'PCT10', CATALOG);
    assert.deepEqual(result, { ok: true, discountCents: 100, totalCents: 901 });
  });

  it('applies minimum-order code when threshold is exactly met', () => {
    const result = applyDiscount(1000, 'MINORDER', CATALOG);
    assert.equal(result.ok, true);
    assert.equal(result.discountCents, 100);
  });

  it('accepts an ISO string for expiresAt', () => {
    const catalog = { X: { type: 'fixed', value: 10, expiresAt: '2099-01-01T00:00:00Z' } };
    const result = applyDiscount(100, 'X', catalog);
    assert.deepEqual(result, { ok: true, discountCents: 10, totalCents: 90 });
  });

  it('accepts minOrderCents as an alias for minimumOrderCents', () => {
    const result = applyDiscount(1000, 'MINALT', CATALOG);
    assert.equal(result.ok, true);
  });

  it('accepts "percentage" as an alias for "percent" type', () => {
    const catalog = { X: { type: 'percentage', value: 10 } };
    const result = applyDiscount(1000, 'X', catalog);
    assert.deepEqual(result, { ok: true, discountCents: 100, totalCents: 900 });
  });
});

// ---------------------------------------------------------------------------
// Expiry
// ---------------------------------------------------------------------------

describe('applyDiscount — expiry', () => {
  it('rejects an expired code with reason EXPIRED', () => {
    const result = applyDiscount(1000, 'EXPIRED', CATALOG);
    assert.deepEqual(result, { ok: false, reason: 'EXPIRED' });
  });

  it('accepts a code that expires exactly now (boundary — not yet expired)', () => {
    const boundary = new Date('2030-06-15T12:00:00Z');
    const catalog = { X: { type: 'fixed', value: 10, expiresAt: boundary } };
    const result = applyDiscount(100, 'X', catalog, boundary);
    assert.equal(result.ok, true);
  });

  it('rejects a code that expired one millisecond ago', () => {
    const expiry = new Date('2030-06-15T12:00:00.000Z');
    const catalog = { X: { type: 'fixed', value: 10, expiresAt: expiry } };
    const result = applyDiscount(100, 'X', catalog, new Date(expiry.getTime() + 1));
    assert.deepEqual(result, { ok: false, reason: 'EXPIRED' });
  });
});

// ---------------------------------------------------------------------------
// Minimum order
// ---------------------------------------------------------------------------

describe('applyDiscount — minimum order', () => {
  it('rejects when subtotal is below minimumOrderCents with reason MIN_NOT_MET', () => {
    const result = applyDiscount(999, 'MINORDER', CATALOG);
    assert.deepEqual(result, { ok: false, reason: 'MIN_NOT_MET' });
  });

  it('rejects when subtotal is below minOrderCents (alias field)', () => {
    const result = applyDiscount(999, 'MINALT', CATALOG);
    assert.deepEqual(result, { ok: false, reason: 'MIN_NOT_MET' });
  });

  it('rejects when subtotal is below minimum (alias field)', () => {
    const result = applyDiscount(999, 'MINMIN', CATALOG);
    assert.deepEqual(result, { ok: false, reason: 'MIN_NOT_MET' });
  });

  it('accepts when subtotal exactly meets minimumOrderCents', () => {
    const result = applyDiscount(1000, 'MINORDER', CATALOG);
    assert.equal(result.ok, true);
  });
});

// ---------------------------------------------------------------------------
// Invalid inputs
// ---------------------------------------------------------------------------

describe('applyDiscount — invalid inputs', () => {
  it('rejects a negative subtotal', () => {
    const result = applyDiscount(-1, 'PCT10', CATALOG);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'INVALID_SUBTOTAL');
  });

  it('rejects a float subtotal', () => {
    const result = applyDiscount(9.99, 'PCT10', CATALOG);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'INVALID_SUBTOTAL');
  });

  it('rejects an empty code', () => {
    const result = applyDiscount(1000, '', CATALOG);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'INVALID_CODE');
  });

  it('rejects a whitespace-only code', () => {
    const result = applyDiscount(1000, '   ', CATALOG);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'INVALID_CODE');
  });

  it('rejects a code not present in catalog with reason UNKNOWN_CODE', () => {
    const result = applyDiscount(1000, 'NOPE', CATALOG);
    assert.deepEqual(result, { ok: false, reason: 'UNKNOWN_CODE' });
  });

  it('throws TypeError for null code (programming error, not graceful)', () => {
    assert.throws(() => applyDiscount(1000, null, CATALOG), TypeError);
  });

  it('throws TypeError for undefined code (programming error, not graceful)', () => {
    assert.throws(() => applyDiscount(1000, undefined, CATALOG), TypeError);
  });

  it('throws TypeError for null catalog (programming error, not graceful)', () => {
    assert.throws(() => applyDiscount(1000, 'PCT10', null), TypeError);
  });

  it('throws TypeError for undefined catalog (programming error, not graceful)', () => {
    assert.throws(() => applyDiscount(1000, 'PCT10', undefined), TypeError);
  });

  it('throws TypeError for null catalog entry (programming error, not graceful)', () => {
    assert.throws(() => applyDiscount(1000, 'PCT10', { PCT10: null }), TypeError);
  });
});

// ---------------------------------------------------------------------------
// Malformed catalog entries
// ---------------------------------------------------------------------------

describe('applyDiscount — malformed catalog entries', () => {
  it('rejects a percent value over 100', () => {
    const catalog = { X: { type: 'percent', value: 101 } };
    const result = applyDiscount(1000, 'X', catalog);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'INVALID_CODE_CONFIG');
  });

  it('rejects a negative percent value', () => {
    const catalog = { X: { type: 'percent', value: -5 } };
    const result = applyDiscount(1000, 'X', catalog);
    assert.equal(result.ok, false);
  });

  it('rejects a fractional fixed value', () => {
    const catalog = { X: { type: 'fixed', value: 1.5 } };
    const result = applyDiscount(1000, 'X', catalog);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'INVALID_CODE_CONFIG');
  });

  it('rejects an unknown discount type', () => {
    const catalog = { X: { type: 'bogo', value: 10 } };
    const result = applyDiscount(1000, 'X', catalog);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'INVALID_CODE_TYPE');
  });

  it('rejects an unreadable expiresAt', () => {
    const catalog = { X: { type: 'fixed', value: 10, expiresAt: 'not-a-date' } };
    const result = applyDiscount(1000, 'X', catalog);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'INVALID_CODE_CONFIG');
  });
});
