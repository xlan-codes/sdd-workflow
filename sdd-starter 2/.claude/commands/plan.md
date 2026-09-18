---
description: Write plan.md for a feature (blocked while spec has open questions)
argument-hint: <feature-name>
---
Read `specs/$ARGUMENTS/spec.md`. If **Open questions** is non-empty, STOP and
list them instead of planning.

Otherwise create `specs/$ARGUMENTS/plan.md` from `templates/plan.template.md`:
bounded-context placement, service seams, data & rounding decisions (link or
create ADRs in `specs/$ARGUMENTS/adr/`), risks with mitigations, and the
contract list (OpenAPI paths, .feature scenarios, pacts) that `/tasks` will
slice against. Design lives here — the spec stays "what", the plan is "how".
