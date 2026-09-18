# SDD Starter — Spec-Driven Development, wired for Claude Code

The companion repo to **“Spec-Driven Development for More Efficient Teams.”**
Everything shown on the slides exists here as a working, forkable scaffold:
one feature (`checkout-refunds`, story PLT-4821) carried from EARS criterion
to failing test, plus the commands, hooks, skills and docs around it.

> **Learning the method?** The full end-to-end walkthrough — feature → EARS
> → DDD → tasks → architecture (patterns & principles) → BDD → TDD →
> implement → verify → **DORA** — is in **[WALKTHROUGH.md](WALKTHROUGH.md)**.
>
> **Presenting this live?** The full Jira → spec → DDD → BDD → TDD demo
> runbook is in **[DEMO.md](DEMO.md)** — configuration, 12-minute script,
> fallbacks and reset.

## Quickstart

```bash
npm install          # jest + ts-jest + typescript
npm test             # ⇒ RED: T3 is intentionally unimplemented
npm run typecheck:noinstall   # type-checks with zero dependencies installed
```

The failing test is the point — `src/refunds/application/refunds.service.spec.ts` is the
executable contract for task **T3**. Implement `RefundCalculator.calculate()`
(TDD: red → green → refactor) and the suite goes green.

## Using it with Claude Code

| Command        | What it does                                                        |
|----------------|---------------------------------------------------------------------|
| `/specify <feature>`  | scaffolds `specs/<feature>/spec.md` from the template; gates on EARS quality |
| `/plan <feature>`     | writes `plan.md`; refuses while `Open questions` is non-empty        |
| `/tasks <feature>`    | slices work into S/M tasks, 1 : 1 : 1 with criteria & contracts      |
| `/implement <task>`   | runs the TDD loop against the task’s contract                        |
| `/verify <feature>`   | fills `verification.md`; every EARS line must map to a green test    |

The **resource-resolution gate** (`.claude/hooks/resource_gate.sh`) blocks
edits outside the active task’s declared `Touches:` globs — set
`.claude/state/ACTIVE_TASK` to e.g. `checkout-refunds T3` and try editing a
file outside `src/refunds/**` to see it refuse.

## Repo ↔ deck map

| In the deck                        | In this repo                                   |
|------------------------------------|------------------------------------------------|
| What is SDD / six artifacts        | `specs/checkout-refunds/*`, `templates/`       |
| EARS patterns                      | `.claude/skills/ears-authoring/SKILL.md`       |
| Spec anatomy & folder structure    | `specs/checkout-refunds/`, `templates/spec.template.md` |
| EARS → Gherkin → OpenAPI → test    | `contracts/`, `src/refunds/application/refunds.service.spec.ts` |
| Task anatomy & estimation          | `specs/checkout-refunds/tasks.md`, `docs/estimation.md` |
| CLAUDE.md & skills context stack   | `CLAUDE.md`, `.claude/skills/`                 |
| MCP token economics                | `.mcp.json` (scoped, empty by default), `CLAUDE.md` §Context |
| Resource-resolution gate           | `.claude/hooks/resource_gate.sh` + `.claude/settings.json` |
| Scrum & Kanban remap, Sprint 14    | `docs/scrum-kanban.md`                         |
| DORA · SDD · SPACE · DevEx · GSM   | `docs/metrics.md`                              |
| Workflow, cost curve, pros & cons  | `docs/workflow.md`                             |
| Code structure & debugging practices | `docs/code-structure.md`                     |
| DDD bounded-context map              | `docs/ddd.md`                                |
| Jira entry point & live demo         | `jira/`, `DEMO.md`, `solution/`              |
| End-to-end method walkthrough        | `WALKTHROUGH.md`                             |
| Spec lifecycle at sprint boundaries  | `docs/spec-lifecycle.md` · Amendment A1 in `specs/checkout-refunds/` · fresh `specs/wallet-credit/` |
| Jira + GitLab metrics configuration  | `METRICS-SETUP.md`, `scripts/dora_dashboard.py`, `scripts/contract_coverage.sh` |
| Hexagonal seams (ports & adapters)   | `src/refunds/application/ports.ts`, `refunds.service.ts` |

## Layout

```
CLAUDE.md                  the constitution — short, always in context
.claude/                   commands · skills · hooks · state
.mcp.json                  MCP scoped per repo (empty by default, on purpose)
templates/                 spec / plan / tasks / verification / ADR templates
specs/checkout-refunds/    the worked feature: 6 artifacts
src/                       code skeleton + the RED contract test
docs/                      workflow · estimation · scrum-kanban · metrics
```

Spec first, verify always.
