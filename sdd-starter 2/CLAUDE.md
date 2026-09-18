# CLAUDE.md — project constitution (keep < 300 lines; link out, don't inline)

## Project
SDD starter: TypeScript service skeleton demonstrating Spec-Driven Development.
Feature under work: `specs/checkout-refunds/` (story PLT-4821).

## Commands
- `npm test` — jest suite (contract tests live next to code: `*.spec.ts`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run typecheck:noinstall` — type-check before any `npm install`

## Architecture map
- `src/shared/` — value objects (`Money`, banker's rounding per ADR-017)
- `src/refunds/` — refunds bounded context (calculator, fixtures, contract spec)
- `specs/<feature>/` — the six artifacts: spec.md · plan.md · tasks.md ·
  contracts/ · verification.md · adr/

## SDD rules (non-negotiable)
1. **Entry gate:** no approved `spec.md` + contracts → the work does not start.
2. **Exit gate:** no green `verification.md` section → the PR does not merge.
3. `spec.md` **Open questions must be empty** before `plan.md` is written.
4. Every task is **1 : 1 : 1** — one EARS criterion, one contract, one ticket.
5. Tasks are **S or M only** (S ≤ ½ day, M ≤ 1 day). An L is two tasks.
6. Every task declares **`Touches:` path globs** — the resource gate enforces them.
7. Tests come **from the contract, before implementation** (Red first).
8. Deviations are **ADRs** in `specs/<feature>/adr/`, never chat messages.
9. Status is test status: **Red / Green / Verified** — "90 % done" does not parse.

## Context budget (what goes where)
- Needed **every turn** → this file. Keep it rules, not essays.
- Needed **sometimes** → a skill in `.claude/skills/` (loads on trigger).
- Must **never be skipped** → a hook in `.claude/hooks/`.
- MCP servers: scope per repo in `.mcp.json`; prefer skills for knowledge,
  MCP for actions; expose the 5 tools you use, not a server's 40.

## Pointers (read on demand, not resident)
- Workflow & gates ..... docs/workflow.md
- Task writing & sizing  docs/estimation.md
- Ceremonies & board ... docs/scrum-kanban.md
- Metrics .............. docs/metrics.md
- EARS how-to .......... .claude/skills/ears-authoring/SKILL.md
