---
description: Fill verification.md — every EARS criterion must map to a green test
argument-hint: <feature-name>
---
For `specs/$ARGUMENTS/`, run the full suite and complete `verification.md`
from `templates/verification.template.md`:

- One row per EARS criterion: criterion -> test(s) -> status (Red/Green).
- One section per task: evidence, deviations, linked ADRs.
- Any Red row: the feature does NOT pass the exit gate — say so plainly,
  reopen the spec or the task, and list exactly what is missing.
- All green: stamp the verdict line `CONFORMS — <date>` and summarize
  first-pass rate (tasks green without rework / total tasks).
