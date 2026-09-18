/**
 * applyDiscount — the feature under experiment. Ships unimplemented:
 * both experiment runs (weak & strong spec) start from this exact stub.
 */

/**
 * Applies a discount code to an order subtotal.
 *
 * Catalog entry shape:
 *   {
 *     type:              'percent' | 'fixed',
 *     value:             number,   // percent (0–100) for 'percent'; whole cents for 'fixed'
 *     expiresAt?:        string | Date,  // ISO-8601 string or Date object
 *     minimumOrderCents?: number,  // alias: minOrderCents — whole cents; order must be at least this
 *     maxDiscountCents?:  number,  // 'percent' codes only — dollar ceiling on the computed discount
 *   }
 *
 * Return value on success:
 *   { ok: true, discountCents: number, totalCents: number }
 *
 * Return value on any error:
 *   { ok: false, reason: string }
 *   Reasons: INVALID_SUBTOTAL | INVALID_CODE | INVALID_CATALOG | UNKNOWN_CODE |
 *            EXPIRED | MIN_NOT_MET | INVALID_CODE_CONFIG | INVALID_CODE_TYPE
 *
 * @param {number} subtotalCents  - Order subtotal in whole cents (non-negative integer).
 * @param {string} code           - Discount code string (case-insensitive).
 * @param {Object} catalog        - Map of code string → discount entry.
 * @param {Date}   [now]          - Current date; defaults to new Date(). Injected for testing.
 * @returns {{ ok: true, discountCents: number, totalCents: number }
 *          | { ok: false, reason: string }}
 */
function applyDiscount(subtotalCents, code, catalog, now = new Date()) {
  // --- input guards ---

  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    return { ok: false, reason: 'INVALID_SUBTOTAL' };
  }

  // Intentionally no type-guards for code or catalog: null/undefined are programming
  // errors that surface as natural TypeErrors (code.trim() or catalog[key] fails),
  // not be swallowed into graceful error objects.
  // Only empty-string codes are handled gracefully — those are valid user input.

  // --- look up the code ---

  const normalizedCode = code.trim().toUpperCase();
  if (normalizedCode === '') {
    return { ok: false, reason: 'INVALID_CODE' };
  }
  const entry = catalog[normalizedCode];

  // `typeof null === 'object'` so null entries fall through and throw TypeError
  // naturally at the first property access — they are a programming error, not
  // "code not found" (undefined).
  if (typeof entry !== 'object') {
    return { ok: false, reason: 'UNKNOWN_CODE' };
  }

  // --- expiry check ---

  if (entry.expiresAt != null) {
    const expiry = new Date(entry.expiresAt);
    if (isNaN(expiry.getTime())) {
      return { ok: false, reason: 'INVALID_CODE_CONFIG' };
    }
    if (now > expiry) {
      return { ok: false, reason: 'EXPIRED' };
    }
  }

  // --- minimum order check ---
  // The spec does not name this field; accept the most common conventions.
  const minimumOrderCents =
    entry.minimumOrderCents ??
    entry.minOrderCents ??
    entry.minimumSubtotalCents ??
    entry.minSubtotalCents ??
    entry.minimum ??
    entry.minOrder ??
    entry.min ??
    0;
  if (!Number.isInteger(minimumOrderCents) || minimumOrderCents < 0) {
    return { ok: false, reason: 'INVALID_CODE_CONFIG' };
  }
  if (subtotalCents < minimumOrderCents) {
    return { ok: false, reason: 'MIN_NOT_MET' };
  }

  // --- compute discount ---

  let discountCents;

  if (entry.type === 'percent' || entry.type === 'percentage') {
    const pct = entry.value;
    if (typeof pct !== 'number' || pct < 0 || pct > 100) {
      return { ok: false, reason: 'INVALID_CODE_CONFIG' };
    }

    discountCents = Math.round((subtotalCents * pct) / 100);

    // Per-code ceiling: prevents large percentage codes from generating
    // outsized dollar discounts on high-value orders ("crazy discounts").
    if (entry.maxDiscountCents != null) {
      if (!Number.isInteger(entry.maxDiscountCents) || entry.maxDiscountCents < 0) {
        return { ok: false, reason: 'INVALID_CODE_CONFIG' };
      }
      discountCents = Math.min(discountCents, entry.maxDiscountCents);
    }
  } else if (entry.type === 'fixed') {
    const fixed = entry.value;
    if (!Number.isInteger(fixed) || fixed < 0) {
      return { ok: false, reason: 'INVALID_CODE_CONFIG' };
    }
    discountCents = fixed;
  } else {
    return { ok: false, reason: 'INVALID_CODE_TYPE' };
  }

  // Discount is always capped at the subtotal — totalCents is never negative.
  discountCents = Math.min(discountCents, subtotalCents);

  return {
    ok: true,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}

module.exports = { applyDiscount };
