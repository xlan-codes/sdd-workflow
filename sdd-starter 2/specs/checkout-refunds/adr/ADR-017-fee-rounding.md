# ADR-017 — Banker's rounding for fee subtraction

Status: Accepted
Date: 2026-08-03
Relates to: EARS-2 · task T3

## Context
Refund = ticket price − service fees. Fee percentages can produce half-cent
values; naive half-up rounding systematically overcharges buyers across
volume, and mixed strategies across services caused ±1-cent reconciliation
noise (2 h lost in Sprint 14 to exactly this ambiguity).

## Decision
All monetary rounding in the refunds context uses **banker's rounding
(half-to-even)** applied once, at the final subtraction, in `Money.roundBankers`.
No intermediate rounding.

## Consequences
- + Reconciliation-neutral over volume; single, testable rule
- + The contract test pins the behaviour (spec, not folklore)
- − Engineers must not "fix" 2.5 → 3 by intuition; the ADR is the answer
