# DDD in this repo — the strategic layer

## Bounded contexts (ticketing platform, simplified)
| Context      | Owns                                   | Speaks                    |
|--------------|----------------------------------------|---------------------------|
| Ordering     | carts, orders, order state             | order, line item, PAID    |
| Payments     | PSP integration, captures, chargebacks | capture, settlement       |
| **Refunds**  | refund policy & math, refund state     | refund, fees, ISSUED      |
| Notification | outbound messages                      | event, template           |

**Why the calculator lives in Refunds:** the refund *policy* (price − service
fees, banker's rounding, idempotency) is Refunds' language. Payments only
executes the money movement; Ordering only flips order state. One context, one
folder — `src/refunds/` — so a failing refunds contract points at exactly one
directory.

## Ubiquitous language (excerpt — same nouns from PO to code)
- **service fees** — our fees on the order snapshot; *not* PSP fees (decided in
  spec review, PLT-4821; see the ticket comment that almost became a bug).
- **ISSUED / PENDING** — refund states; duplicates while in either → `409`
  (EARS-3).
- **minor units** — all money in integer cents (EARS-1, `Money`).

## Context mapping for this feature
Refunds is *downstream* of Ordering (conformist on the order snapshot: totals
and fees come frozen on the order, never recomputed from live config) and
*upstream* of Notification (publishes `refund.issued` v1 — T4).

Strategic design happens in `plan.md`; this file is the map you point at.
