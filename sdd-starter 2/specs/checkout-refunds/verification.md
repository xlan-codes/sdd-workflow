# checkout-refunds — verification.md

## Criteria coverage
| Criterion | Test(s) | Status |
|-----------|---------|--------|
| EARS-1 | refunds.service.spec.ts :: "amounts are minor units" | Green |
| EARS-2 | refunds.service.spec.ts :: "refunds price minus fees" | **Red — T3 open** |
| EARS-3 | (T2) duplicate-409 contract test | Pending |
| EARS-4 | (T6) 401 contract test | Pending |
| EARS-5 | superseded by Amendment A1 → EARS-6/7 | — |
| EARS-6 | (T7) line-item contract test | Pending — Sprint 15 |
| EARS-7 | (T8) duplicate-line 409 test | Pending — Sprint 15 |

## Per-task evidence
### T1
- Suite: `npm test` compiles harness · Result: in use by T3 spec
### T3
- Suite: `refunds.service.spec.ts` · Result: **RED by design** — implement via /implement T3
- Deviations: rounding decided up-front (ADR-017), not during coding

## Verdict
PENDING — exit gate closed until EARS-2 row is Green.
First-pass rate: —/6 (sprint in progress)
