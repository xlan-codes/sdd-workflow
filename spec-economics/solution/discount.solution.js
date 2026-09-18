/** Reference GREEN implementation — proves the oracle is satisfiable; demo safety net. */
function applyDiscount(subtotalCents, code, catalog, now = new Date()) {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new TypeError("subtotalCents must be a non-negative integer (minor units)");
  }
  const entry = catalog[String(code).trim().toUpperCase()];
  if (!entry) return { ok: false, reason: "UNKNOWN_CODE" };
  if (entry.expiresAt && now > new Date(entry.expiresAt)) return { ok: false, reason: "EXPIRED" };
  if (entry.minSubtotalCents && subtotalCents < entry.minSubtotalCents) {
    return { ok: false, reason: "MIN_NOT_MET" };
  }
  let discountCents =
    entry.type === "percent" ? Math.round((subtotalCents * entry.value) / 100) : entry.value;
  if (entry.maxDiscountCents != null) discountCents = Math.min(discountCents, entry.maxDiscountCents);
  discountCents = Math.min(discountCents, subtotalCents);
  return { ok: true, discountCents, totalCents: subtotalCents - discountCents };
}

module.exports = { applyDiscount };
