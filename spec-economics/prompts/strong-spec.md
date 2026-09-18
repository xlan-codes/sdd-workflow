# Feature: discount codes — spec (approved)

Implement `applyDiscount(subtotalCents, code, catalog, now)` in
`src/discount.js` (CommonJS, keep the export shape).

## Acceptance criteria (EARS)
- **EARS-1** (Ubiquitous) — All amounts shall be integer minor units (cents);
  non-integer or negative `subtotalCents` shall throw `TypeError`.
- **EARS-2** (Ubiquitous) — Percentage discounts shall round to the nearest
  cent, half up (`Math.round` semantics).
- **EARS-3** (Ubiquitous) — A discount shall never take the total below zero:
  cap `discountCents` at `subtotalCents`.
- **EARS-4** (Optional) — WHERE a code defines `maxDiscountCents`, the discount
  shall be capped at that value (applied before the EARS-3 cap).
- **EARS-5** (Ubiquitous) — Code lookup shall be case-insensitive and shall
  trim surrounding whitespace.
- **EARS-6** (Unwanted) — IF `now` is past a code's `expiresAt`, THEN return
  `{ ok: false, reason: "EXPIRED" }`.
- **EARS-7** (Unwanted) — IF `subtotalCents` is below the code's
  `minSubtotalCents`, THEN return `{ ok: false, reason: "MIN_NOT_MET" }`.
- **EARS-8** (Unwanted) — IF the code is not in the catalog, THEN return
  `{ ok: false, reason: "UNKNOWN_CODE" }`.

Success shape: `{ ok: true, discountCents, totalCents }` (integers).
Check order: unknown → expired → minimum → compute → caps.

## Contract (the executable definition of done)
`test/contract.test.mjs` encodes every criterion. Run `npm test` and iterate
until **all tests pass**; do not modify the tests.

## Out of scope
Persistence, HTTP, code stacking (exactly one code per call), currency
formatting, i18n. Do not add configuration or features beyond the criteria.
