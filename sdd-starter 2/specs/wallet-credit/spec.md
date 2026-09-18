# wallet-credit — spec.md
*New feature, new folder — Sprint 15 · PLT-4907. Spec exists BEFORE any code
(`src/wallet/` will be created by T1): that is the point. Criteria are
numbered in the 100-block so IDs stay unique repo-wide for tooling.*

## 1. Context
Buyers may choose wallet credit instead of a card refund: instant, no PSP
round-trip. The Wallet bounded context consumes `refund.issued` v1 from
Refunds (context map: Wallet is downstream of Refunds; Refunds knows nothing
about balances).

## 2. Scope
**In:** consuming `refund.issued` (target=wallet) · crediting balances ·
idempotent event handling.
**Out:** spending credit · top-ups · currency conversion · expiring credits
(decided: credits do not expire — see Open questions).

## 3. Acceptance criteria (EARS)
- **EARS-101** (Ubiquitous) — Wallet balances shall be stored and returned in
  minor units (cents).
- **EARS-102** (Event-driven) — WHEN a `refund.issued` v1 event with
  `target=wallet` is consumed, the wallet shall credit the amount within 5 s.
- **EARS-103** (State-driven) — WHILE an eventId has been processed, duplicate
  deliveries of that eventId shall not change the balance (exactly-once
  effect).
- **EARS-104** (Unwanted) — IF the wallet account is closed, THEN the system
  shall emit `wallet.credit_failed` v1 and shall not retry.

## 4. Non-functionals
- p95 event-to-credit ≤ 5 s · consumer lag alarm at 30 s
- Money math: integer cents only (shared `Money`)

## 5. Open questions
- (none — "do credits expire?" resolved 2026-09-01: no; ADR-020)
