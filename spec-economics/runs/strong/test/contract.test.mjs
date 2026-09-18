/**
 * THE STAKEHOLDER'S TRUTH — what was actually wanted, as executable asserts.
 * In the weak-spec run this file is HIDDEN from the agent (it plays the
 * reviewer who "knows it when they see it"). In the strong-spec run the same
 * file is handed over up front as test/contract.test.mjs.
 * Zero dependencies: runs with `node --test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { applyDiscount } = require("../src/discount.js");

const CATALOG = {
  SAVE10: { type: "percent", value: 10 },
  TENOFF: { type: "fixed", value: 1000 },
  BIG50: { type: "percent", value: 50, maxDiscountCents: 2000 },
  OLD5: { type: "fixed", value: 500, expiresAt: "2020-01-01T00:00:00Z" },
  VIP30: { type: "fixed", value: 3000, minSubtotalCents: 5000 },
};
const NOW = new Date("2026-06-01T12:00:00Z");

test("percent discount rounds half-up to the cent (EARS-2)", () => {
  const r = applyDiscount(12345, "SAVE10", CATALOG, NOW); // 10% = 1234.5
  assert.deepEqual(r, { ok: true, discountCents: 1235, totalCents: 11110 });
});

test("fixed discount never takes the total below zero (EARS-3)", () => {
  const r = applyDiscount(999, "TENOFF", CATALOG, NOW);
  assert.deepEqual(r, { ok: true, discountCents: 999, totalCents: 0 });
});

test("percent discount respects maxDiscountCents cap (EARS-4)", () => {
  const r = applyDiscount(100000, "BIG50", CATALOG, NOW);
  assert.deepEqual(r, { ok: true, discountCents: 2000, totalCents: 98000 });
});

test("codes are case-insensitive and trimmed (EARS-5)", () => {
  const r = applyDiscount(10000, "  save10 ", CATALOG, NOW);
  assert.deepEqual(r, { ok: true, discountCents: 1000, totalCents: 9000 });
});

test("expired code is rejected with reason EXPIRED (EARS-6)", () => {
  assert.deepEqual(applyDiscount(10000, "OLD5", CATALOG, NOW), { ok: false, reason: "EXPIRED" });
});

test("minimum subtotal is enforced with reason MIN_NOT_MET (EARS-7)", () => {
  assert.deepEqual(applyDiscount(4000, "VIP30", CATALOG, NOW), { ok: false, reason: "MIN_NOT_MET" });
  assert.deepEqual(applyDiscount(5000, "VIP30", CATALOG, NOW), { ok: true, discountCents: 3000, totalCents: 2000 });
});

test("unknown code is rejected with reason UNKNOWN_CODE (EARS-8)", () => {
  assert.deepEqual(applyDiscount(10000, "NOPE", CATALOG, NOW), { ok: false, reason: "UNKNOWN_CODE" });
});

test("amounts are integer minor units — non-integers throw TypeError (EARS-1)", () => {
  assert.throws(() => applyDiscount(10.5, "SAVE10", CATALOG, NOW), TypeError);
  assert.throws(() => applyDiscount(-1, "SAVE10", CATALOG, NOW), TypeError);
});
