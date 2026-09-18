---
name: ears-authoring
description: How to write EARS acceptance criteria (Easy Approach to Requirements Syntax) — use when authoring or reviewing spec.md criteria, or when a requirement feels vague or untestable.
---

# Writing EARS criteria

Five patterns — pick the one that matches the behaviour:

| Pattern      | Template                                          | Example (ticketing platform) |
|--------------|---------------------------------------------------|------------------------------|
| Ubiquitous   | The <system> shall <response>                     | The pricing API shall return amounts in minor units (cents). |
| Event-driven | WHEN <trigger>, the <system> shall <response>     | WHEN payment capture fails, the order shall remain PENDING and emit order.failed. |
| State-driven | WHILE <state>, the <system> shall <response>      | WHILE an event is on-sale, a held seat shall auto-release after 5 minutes. |
| Unwanted     | IF <condition>, THEN the <system> shall <response>| IF the access token is expired, THEN the API shall return 401 with WWW-Authenticate. |
| Optional     | WHERE <feature>, the <system> shall <response>    | WHERE VIP packages are enabled, checkout shall render the upsell step. |

Rules:
1. **Testable** — every criterion maps to ≥ 1 assertion in `contracts/`.
2. **Unambiguous** — one interpretation. Ban "fast", "user-friendly", "robust".
3. **What, never how** — design belongs in `plan.md`.

Litmus test: *if you can't write the failing test, rewrite the criterion.*
Number criteria `EARS-1..n`; tasks and verification rows reference the numbers.
