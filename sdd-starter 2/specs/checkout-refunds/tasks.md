# checkout-refunds — tasks.md

> Sizing: S ≤ ½ day · M ≤ 1 day · **never L** (an L is two tasks).
> Every task: 1 EARS criterion · 1 contract · 1 ticket. Declare `Touches:` globs.

## T1 — Order fixtures & harness   [S]
From:     spec.md §3 · criterion EARS-1
Contract: refunds.feature background ("a paid order")
Scope:    in-memory orders, `paidOrder()`, `events.cancel()`, `refundFor()`
Out:      persistence → later feature
Done:     harness compiles; used by T3 spec
Depends: —   Touches: src/refunds/**, src/shared/**   Est: S ≤ ½d

## T2 — Refund endpoint skeleton (contract-first)   [S]
From:     spec.md §3 · criterion EARS-3
Contract: openapi.yaml POST /orders/{id}/refunds (201/409)
Scope:    route + DTOs generated from openapi; 409 duplicate path
Out:      calculation logic → T3
Done:     contract test for 409 green
Depends: T1   Touches: src/refunds/**   Est: S ≤ ½d

## T3 — Refund calculation service   [M]
From:     spec.md §3 · criterion EARS-2
Contract: POST /orders/{id}/refunds + refunds.feature "refund on cancellation"
Scope:    RefundCalculator.calculate(order) · banker's rounding — per ADR-017
Out:      notification event → T4 · refund UI → T5
Done:     refunds.service.spec.ts green · verification.md §T3 conforms
Depends: T1   Touches: src/refunds/**, src/shared/**   Est: M ≤ 1d

## T4 — refund.issued notification event   [S]
From:     spec.md §2/§3 · supports EARS-2 (out-of-scope wiring)
Contract: event schema `refund.issued` v1
Scope:    publish after ISSUED transition
Out:      consumer templates
Done:     event contract test green
Depends: T3   Touches: src/refunds/**   Est: S ≤ ½d

## T5 — Refund status UI slice   [M]
From:     spec.md §2 · buyer-visible status
Contract: pact checkout-web ↔ orders-svc (GET refund status)
Scope:    status endpoint + pact
Out:      styling polish
Done:     pact verifies on both sides
Depends: T2   Touches: src/refunds/**   Est: M ≤ 1d

## T6 — Expired-token guard   [S]
From:     spec.md §3 · criterion EARS-4
Contract: openapi.yaml 401 + WWW-Authenticate
Scope:    auth middleware behaviour on this route
Out:      token refresh flows
Done:     401 contract test green
Depends: T2   Touches: src/refunds/**   Est: S ≤ ½d

## T7 — Line-item refund calculation   [M]   *(Sprint 15 · Amendment A1)*
From:     spec.md §A1 · criterion EARS-6
Contract: refunds.feature "partial refund for selected line items" (added with this task) + openapi.yaml lines[] body
Scope:    per-line amount = price − proportional fees · banker's per line then sum (ADR-021)
Out:      UI selection → T5 · notification copy → T4
Done:     line-item contract test green · verification.md §T7 conforms
Depends: T3   Touches: src/refunds/**, src/shared/**   Est: M ≤ 1d

## T8 — Line-item idempotency (409 per line)   [S]   *(Sprint 15 · Amendment A1)*
From:     spec.md §A1 · criterion EARS-7
Contract: refunds.feature "second refund for the same line item is rejected"
Scope:    refund aggregate keyed by (orderId, lineItemId) for partials
Out:      cross-order dedupe
Done:     duplicate-line 409 test green
Depends: T7   Touches: src/refunds/**   Est: S ≤ ½d

## Estimation summary
Sprint 14 — S: 4 · M: 2 · total ≤ 4 dev-days · review/verification budget booked: 1.5 days
Sprint 15 (A1) — S: 1 · M: 1 · total ≤ 1.5 dev-days · review budget: 0.5 days
