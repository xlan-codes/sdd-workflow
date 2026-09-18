---
description: Scaffold specs/<feature>/spec.md from the template and gate its quality
argument-hint: <feature-name>
---
Create `specs/$ARGUMENTS/spec.md` from `templates/spec.template.md`, then work
with me to fill it. Enforce, in order:

1. **Context** is one paragraph and links the ticket.
2. **Scope** has explicit In/Out lists — push back until "Out" is non-empty.
3. Every acceptance criterion is **EARS** (see skill `ears-authoring`),
   uniquely numbered `EARS-n`, and passes the litmus test:
   *if you can't write the failing test, rewrite the criterion.*
4. **Non-functionals** are numbers, not adjectives.
5. Do NOT proceed to planning: `/plan` is blocked while **Open questions** is non-empty.

Finish by listing each EARS line with the test type that will cover it.
