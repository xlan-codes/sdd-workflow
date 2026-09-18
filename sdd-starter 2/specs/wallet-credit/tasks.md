# wallet-credit — tasks.md
> Every task: 1 EARS criterion · 1 contract · 1 ticket. Declare `Touches:` globs.
> `src/wallet/` does not exist yet — T1 creates it. Spec precedes code.

## T1 — Consumer skeleton + processed-event store   [S]
From:     spec.md §3 · criterion EARS-103
Contract: wallet.feature "duplicate delivery does not double-credit"
Scope:    event consumer port · ProcessedEventRepository (idempotency)
Out:      real broker wiring (in-memory first)
Done:     duplicate-delivery test green
Depends: —   Touches: src/wallet/**, src/shared/**   Est: S ≤ ½d

## T2 — Credit application   [M]
From:     spec.md §3 · criteria EARS-101, EARS-102
Contract: wallet.feature "wallet is credited on refund.issued(target=wallet)"
Scope:    WalletService.credit · balance repository · minor units via Money
Out:      spending, statements
Done:     credit contract test green · p95 ≤ 5 s measured in CI perf smoke
Depends: T1   Touches: src/wallet/**   Est: M ≤ 1d

## T3 — Closed-account path   [S]
From:     spec.md §3 · criterion EARS-104
Contract: wallet.feature "closed account emits wallet.credit_failed"
Scope:    failure event v1 · no retry
Out:      account lifecycle management
Done:     failure-path test green
Depends: T1   Touches: src/wallet/**   Est: S ≤ ½d

## Estimation summary
S: 2 · M: 1 · total ≤ 2 dev-days · review budget: 0.5 days
