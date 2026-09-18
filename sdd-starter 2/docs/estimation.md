# Writing tasks & estimating

## The task, written right (see specs/checkout-refunds/tasks.md · T3)
1. **Traceable** — one EARS criterion + one contract, 1:1:1 with the ticket.
2. **Vertically sliced** — ships alone, ≤ 1 day; bigger means two tasks.
3. **Scope has an "Out" list** — gold-plating dies here, in writing.
4. **Executable DoD** — done = a named test file is green; nothing softer.
5. **Resources declared** — `Touches:` globs feed the resource gate.

## How to estimate
- **Slice ≤ 1 day** — a two-day smell = two tasks.
- **S / M — never L** — S ≤ ½ day · M ≤ 1 day · an L splits.
- **Budget the verify** — with agents typing, review & verification are the
  constraint; book them like build time (Sprint 14 reserved ~1.5 days on 4).
- Variance collapses when slices are small: the plan becomes countable —
  "6 stories → 21 tasks" is an estimate a stakeholder can audit.
