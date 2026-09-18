---
description: TDD loop for one task (Red -> Green -> Refactor against its contract)
argument-hint: <task-id, e.g. T3>
---
Set `.claude/state/ACTIVE_TASK` to `<feature> $ARGUMENTS` first — the resource
gate will block edits outside the task's `Touches:` globs.

Loop, strictly in this order:
1. **Red** — write/extend the failing test named in the task's `Done:` line,
   derived from the contract (never from the implementation).
2. **Green** — minimal code to pass. Nothing speculative.
3. **Refactor** — only while the suite stays green.
4. Re-run `npm test`. Repeat until the task's tests are green.

If the contract turns out ambiguous: STOP, reopen the spec (`Open questions`),
and log the decision as an ADR — do not "interpret" silently.
