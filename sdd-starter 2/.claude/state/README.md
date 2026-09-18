# .claude/state

`ACTIVE_TASK` holds the task the agent is allowed to work on, e.g.:

```
checkout-refunds T3
```

The PreToolUse hook (`resource_gate.sh`) reads it, looks up that task's
`Touches:` globs in `specs/<feature>/tasks.md`, and blocks source edits
outside them. Delete the file to lock source edits entirely.
