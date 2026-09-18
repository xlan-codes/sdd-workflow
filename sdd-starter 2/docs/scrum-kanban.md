# SDD inside Scrum & Kanban

## Ceremonies keep their names, change their job
- **Refinement → spec authoring** — PO + engineer draft spec.md; exit: EARS
  reviewed, open questions emptied.
- **Planning → pick approved specs** — only spec'd items enter; estimates sit
  on ≤ 1-day slices.
- **Daily → test status** — every task is Red, Green or Verified; "90 % done"
  no longer parses.
- **Review → run the verified slice** — verification.md is the demo script.
- **Retro → tune the spec template** — first-pass rate shows which section fails.

## The board becomes the pipeline
Columns: **Spec → Contract → Red → Green → Verify** (→ Done).
Pull policy: nothing enters Red without an approved contract.
WIP: one open contract per engineer. Cycle time: spec-approved → verified.

## Worked reference (Sprint 14, "Refunds & Wallet", 5 devs · 10 days)
- Day 1: gate holds 8 → 6 stories; 6 → 21 tasks; review bandwidth booked first.
- Day 6: board = Contract 2 · Red 3 · Green 4 · Verified 12; PLT-4830 fails
  verify (ambiguous fee rounding) → spec reopened, ADR-017, cost 2 h pre-merge;
  mid-sprint sales ask → refinement queue, sprint sealed.
- Day 10: 5/6 stories verified live behind flags; 1 rolls visibly Red;
  first-pass 81 % → target 90 %.
Rule: the unit of planning is the spec · of status the test · of demo the
verified slice. The bottleneck is review & verification — plan that bandwidth.
