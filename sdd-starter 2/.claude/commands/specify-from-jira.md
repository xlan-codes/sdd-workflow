---
description: Turn a Jira issue (jira/<KEY>.json or live via REST/MCP) into a gated spec.md
argument-hint: <ISSUE-KEY, e.g. PLT-4821>
---
Source the ticket, in this order of preference:
1. `jira/$ARGUMENTS.json` if it exists (offline demo default);
2. otherwise run `scripts/jira-fetch.sh $ARGUMENTS` (needs JIRA_BASE_URL + JIRA_TOKEN);
3. otherwise, if an Atlassian MCP server is configured, fetch the issue through it.

Then create `specs/<feature>/spec.md` from `templates/spec.template.md` and,
working with me:

1. **Context** — one paragraph from the summary/description; link the ticket key.
2. **Mine the whole ticket** — description AND comments. Half-decisions in
   comments ("fees = service fees… I think", "no double refunds") become either
   confirmed criteria or **Open questions** — never silent assumptions.
3. Rewrite every requirement as **EARS** (skill: `ears-authoring`), numbered
   `EARS-n`. Flag each vague word (automatic? within when? which fees?) and
   force a decision or an open question.
4. **Scope** with explicit In/Out; **Non-functionals as numbers**.
5. STOP at the gate: report the Open-questions list. `/plan` stays blocked
   until it is empty — that emptying conversation IS the demo's money moment.
