---
description: Slice a planned feature into S/M tasks, 1:1:1 with criteria and contracts
argument-hint: <feature-name>
---
From `specs/$ARGUMENTS/spec.md` + `plan.md`, write `tasks.md` using
`templates/tasks.template.md`. Rules (refuse to violate them):

- **1 : 1 : 1** — every task maps to exactly one EARS criterion and one contract.
- **S or M only** (S ≤ ½ day, M ≤ 1 day). Anything larger becomes two tasks.
- Each task declares `From:`, `Contract:`, `Scope:` **and `Out:`**,
  an executable `Done:` (a named test file), `Depends:`, and
  **`Touches:` path globs** — the resource gate enforces these.
- Order tasks so the critical path is visible; fixtures/stubs first.

End with the estimation summary: count of S, count of M, total ≤-days.
