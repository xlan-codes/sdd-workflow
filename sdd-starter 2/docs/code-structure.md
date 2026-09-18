# Code structure — layers inside bounded contexts

The rule from the deck (slide 9), made literal: **the bounded context is the
first-class folder; the layers live inside it** — never controllers/services
directories smeared across features. When a refunds contract goes red, there
is exactly one directory in the universe to open.

```
src/
├─ main.ts                          ← composition root: wiring only, no logic
├─ shared/                          ← cross-context utilities (pure, no I/O)
│  ├─ money.ts                      ← value object: integer cents, banker's rounding (ADR-017)
│  └─ guard.ts                      ← invariant() · assertNever()
├─ refunds/                         ← ★ the bounded context (one folder = one truth)
│  ├─ domain/                       ← pure core — no I/O, ever
│  │  ├─ types.ts                   ← Order (snapshot), Refund, statuses — the ubiquitous language
│  │  └─ refund-calculator.ts       ← T3 target; pure domain service
│  ├─ application/                  ← use-case orchestration (imperative shell)
│  │  ├─ ports.ts                   ← OrderSnapshotPort · RefundRepository · RefundEventsPort
│  │  ├─ refunds.service.ts         ← idempotency (EARS-3) → calculate (EARS-2) → save → publish
│  │  └─ refunds.service.spec.ts    ← the executable contract (RED until T3)
│  ├─ infrastructure/               ← adapters — swap at main.ts, touch nothing else
│  │  ├─ http/refunds.controller.ts ← thin: parse → delegate → map to OpenAPI 201/404/409
│  │  ├─ repositories/…             ← InMemoryRefundRepository · InMemoryOrderSnapshotRepository
│  │  └─ events/recording-events.ts ← RefundEventsPort test/demo double
│  └─ testing/fixtures.ts           ← shared harness: Jest AND Cucumber bind here (one oracle)
└─ payments/                        ← neighbouring context (out of scope — the gate's proof)
   └─ infrastructure/psp.ts
```

## The dependency rule (what makes it "perfect")

Arrows point **inward only**:
`infrastructure → application → domain` · `shared` is leaf-only · `main.ts`
sees everything, everything else sees nothing concrete.

- **domain/** imports `shared/` and itself. Nothing else. A bug here
  reproduces on a laptop in milliseconds, deterministically — purity is
  search-space compression.
- **application/** imports domain + its own **ports** (interfaces). It never
  names Dynamo, Express or a bus (DIP). Small ports (ISP) keep every test
  double five lines long.
- **infrastructure/** implements the ports: controllers translate protocol ↔
  use case and are thin *by law*; repositories own persistence; events own the
  bus. Swapping in-memory → DynamoDB is a `main.ts` diff.
- **testing/** hosts the shared fixture harness so the Jest contract and the
  Cucumber scenarios exercise the *same* oracle.
- **main.ts** is the only composition root — wiring only. If you find an `if`
  with business meaning here, it's in the wrong file.

## Where a new file goes — the 5-second decision

| You are writing… | It goes in… |
|---|---|
| a business rule / calculation | `refunds/domain/` |
| a use case ("when X, do A then B") | `refunds/application/` |
| anything that speaks HTTP / DB / queue | `refunds/infrastructure/…` |
| a helper with no domain meaning | `shared/` |
| test verbs shared by Jest + BDD | `refunds/testing/` |
| wiring | `src/main.ts` |

## Why not global `controllers/ services/ repos/` at the top?

Because that layout optimizes for the *framework's* taxonomy, not the
*domain's* — one feature ends up smeared across five directories, and a stack
trace becomes a scavenger hunt. Same layer names, same patterns — but scoped
per context, so debugging starts with `cd src/refunds`, and the resource gate
can say `Touches: src/refunds/**` and mean something.
