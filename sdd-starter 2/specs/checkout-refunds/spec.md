# checkout-refunds — spec.md

## 1. Context
When an event is cancelled, buyers must be made whole without manual ops work.
Today refunds are ad-hoc scripts; ambiguity around fees causes rework and
support tickets. Story **PLT-4821**.

## 2. Scope
**In:**
- Automatic refund issuance for orders of a cancelled event
- Refund amount = ticket price minus service fees
- Idempotent refund endpoint

**Out:**
- Buyer notification event (separate task/feature wiring — T4)
- Refund UI (T5)
- Partial / line-item refunds (behind `partial-refunds` flag, EARS-5, later)

## 3. Acceptance criteria (EARS)
- **EARS-1** (Ubiquitous) — The refunds API shall return monetary amounts in
  minor units (cents).
- **EARS-2** (Event-driven) — WHEN an event is cancelled, the system shall
  refund the ticket price minus service fees within 5 business days.
- **EARS-3** (State-driven) — WHILE a refund for an order is PENDING or ISSUED,
  the system shall reject further refund requests for that order with `409`.
- **EARS-4** (Unwanted) — IF the access token is expired, THEN the API shall
  return `401` with a `WWW-Authenticate` header.
- **EARS-5** (Optional) — WHERE partial refunds are enabled, the system shall
  support line-item refunds.

## 4. Non-functionals
- p95 refund issuance call ≤ 300 ms (excl. PSP latency)
- Idempotency: duplicate POSTs never double-refund (see EARS-3)
- Money math: banker's rounding — ADR-017

## 5. Open questions
- (none — emptied 2026-08-03, gate passed)

---

## Amendment A1 — Sprint 15 · PLT-4890 · line-item (partial) refunds
*Appended 2026-09-01. Rule: amendments APPEND — new criteria get fresh IDs;
EARS-1…4 are verified and now act as regression contracts (never renumbered,
never edited). EARS-5's WHERE-flag is hereby activated and made concrete:*

- **EARS-6** (Event-driven) — WHEN a partial refund is requested for specific
  line items of a PAID order, the system shall refund the sum of those line
  items' prices minus their proportional service fees.
- **EARS-7** (State-driven) — WHILE any line item of an order has a PENDING or
  ISSUED refund, further refund requests for that same line item shall be
  rejected with `409`; other line items remain refundable.

Scope In (added): line-item selection in the refund request body.
Scope Out (unchanged): notification wiring (T4) · refund UI (T5).
Open questions: proportional-fee rounding per line → **resolved**: banker's per
line, then sum (extends ADR-017; logged as ADR-021).
Contracts: land with T7 — until then EARS-6/7 correctly show as *uncovered*
in contract coverage. The dip is the signal working.
