# checkout-refunds — plan.md

## Placement
Bounded context: **Orders/Refunds** · Owning team: Checkout squad ·
Seams touched: orders-svc only (no PSP changes in this slice).

## Design decisions
- Refund amount computed in a pure `RefundCalculator` (no I/O) so the
  contract test drives it directly.
- Rounding: **banker's (half-to-even)** on the fee subtraction — ADR-017.
- Idempotency: refund keyed by `orderId`; state machine PENDING → ISSUED.

## Contracts to produce
- openapi: `POST /orders/{id}/refunds` → 201 RefundIssued · 409 AlreadyRefunded
- gherkin: `refunds.feature` — cancellation refund · duplicate 409
- pacts:   checkout-web ↔ orders-svc (stub in contracts/pacts/)

## Risks & mitigations
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Fee model varies by market | M | fees come from the order snapshot, not config |
| Double refunds under retry | M | EARS-3 contract test + idempotency key |

## ADRs
- ADR-017 — Banker's rounding for fee subtraction
