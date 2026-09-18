/**
 * applyDiscount — the feature under experiment. Ships unimplemented:
 * both experiment runs (weak & strong spec) start from this exact stub.
 */
function applyDiscount(subtotalCents, code, catalog, now = new Date()) {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new TypeError("subtotalCents must be a non-negative integer");
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const entry = catalog[normalizedCode];

  if (!entry) {
    return { ok: false, reason: "UNKNOWN_CODE" };
  }

  if (entry.expiresAt && now > new Date(entry.expiresAt)) {
    return { ok: false, reason: "EXPIRED" };
  }

  if (entry.minSubtotalCents != null && subtotalCents < entry.minSubtotalCents) {
    return { ok: false, reason: "MIN_NOT_MET" };
  }

  let discountCents =
    entry.type === "percent"
      ? Math.round((subtotalCents * entry.value) / 100)
      : entry.value;

  if (entry.maxDiscountCents != null && discountCents > entry.maxDiscountCents) {
    discountCents = entry.maxDiscountCents;
  }

  if (discountCents > subtotalCents) {
    discountCents = subtotalCents;
  }

  return { ok: true, discountCents, totalCents: subtotalCents - discountCents };
}

module.exports = { applyDiscount };
