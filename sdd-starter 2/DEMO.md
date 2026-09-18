# DEMO.md — configuring and running the full SDD demo
### Jira ticket → spec (EARS) → DDD → BDD → TDD → verified, in ~12 minutes

*(Stage script only — for the fully reasoned, stage-by-stage method with all
patterns and the DORA close, see [WALKTHROUGH.md](WALKTHROUGH.md).)*

This runbook turns the repo into a live, end-to-end demonstration of the whole
pipeline: a deliberately vague Jira ticket becomes EARS criteria, the criteria
become executable Gherkin and a failing Jest test, an agent (or you) drives
red → green under a resource gate, and verification closes the loop. Every
step has an offline fallback, so the demo cannot be killed by Wi-Fi.

---

## §0 — Prerequisites (10 minutes, once)

| Need | Check | Notes |
|------|-------|-------|
| Node.js ≥ 20 | `node -v` | 22 recommended |
| Claude Code | `claude --version` | `npm i -g @anthropic-ai/claude-code` |
| Model access | `claude` starts a session | Anthropic API key **or** Amazon Bedrock (`CLAUDE_CODE_USE_BEDROCK=1` + AWS creds). If you keep a provider-toggle script, run it before the session and *never* switch mid-demo. |
| This repo | `unzip sdd-starter.zip && cd sdd-starter` | |
| Dependencies | `npm install` | installs jest, ts-jest, cucumber, ts-node |
| Sanity | `npm test` → **RED on T3** · `npm run bdd` → **scenario fails** | red is the correct starting state |
| No-install check | `npm run typecheck:noinstall` | proves the skeleton compiles before any deps — nice opener line |

**Terminal setup for stage:** font ≥ 18 pt, dark theme, two panes — left for
Claude Code, right for `npm test` / `npm run bdd`. Rehearse the pane switch.

---

## §1 — What's in the repo for the demo

```
jira/PLT-4821.json          the vague ticket (the villain)
.claude/commands/
  specify-from-jira.md      Jira → spec.md, gated on EARS quality
  plan.md · tasks.md · implement.md · verify.md
.claude/hooks/resource_gate.sh   the PreToolUse gate (exit 2 = blocked)
.claude/state/ACTIVE_TASK   which task an agent may touch
specs/checkout-refunds/     the six artifacts (already worked, for reference)
docs/ddd.md                 bounded-context map — the DDD talking slide
features/steps/             BDD step definitions binding the .feature file
solution/                   RED stub + GREEN solution + demo:red / demo:green
```

Two demo modes:
- **From scratch (impressive):** delete `specs/checkout-refunds/spec.md` body
  sections and rebuild them live via `/specify-from-jira PLT-4821`.
- **From the worked example (safe):** keep the spec, *walk* it, and spend the
  live minutes on the red → green loop. Recommended for the webinar.

---

## §2 — Configuring the Jira source (pick ONE)

**A. Offline JSON — default, zero risk.** Nothing to configure.
`jira/PLT-4821.json` is a faithful issue export: vague description, untestable
AC, two half-decisions hiding in comments. `/specify-from-jira` reads it first.

**B. Live Jira via REST (Data Center or Cloud).**
```bash
export JIRA_BASE_URL=https://jira.yourcompany.com
export JIRA_TOKEN=<personal-access-token>        # DC: PAT bearer
scripts/jira-fetch.sh PLT-4821                   # writes jira/PLT-4821.json
```
Jira Cloud instead: replace the Bearer header in the script with
`-u you@company.com:$JIRA_API_TOKEN`. Fetch **before** the session and commit
the JSON — never do live auth on stage.

**C. Atlassian MCP (agent reads Jira itself).** In `.mcp.json`:
```json
{ "mcpServers": { "atlassian": { "type": "url", "url": "https://mcp.atlassian.com/v1/mcp" } } }
```
Authenticate once beforehand (`claude mcp list` to confirm). Then
`/specify-from-jira PLT-4821` can pull the issue live — and you get a bonus
talking point: *"note the token cost of that server — slide 23 in action."*
Remove the server after the demo; scope per repo, as preached.

---

## §3 — The 12-minute demo script

**Beat 1 · The villain (1 min).** Open `jira/PLT-4821.json`. Read the AC out
loud: *"refunds work for cancelled events."* Read the comment: *"fees = our
service fees… I think."* Say: "every word of ambiguity here will be typed into
code at machine speed. Let's stop it now."

**Beat 2 · Jira → EARS, the /specify moment (3 min).** In Claude Code:
```
/specify-from-jira PLT-4821
```
Watch it mine the description AND the comments; the "…I think" becomes an
**open question**, not an assumption. Steer one criterion live — ask the room:
*"'automatic refunds' — WHEN exactly?"* — until it reads:
`WHEN an event is cancelled, the system shall refund the ticket price minus
service fees within 5 business days.` Point at the gate: `/plan` refuses while
Open questions is non-empty. Answer the fees question on the spot (service
fees, per the PO) and watch the list empty. **This conversation is the demo.**

**Beat 3 · DDD in one breath (1 min).** Open `docs/ddd.md`. One sentence:
"Refunds is its own bounded context — the calculator lives in `src/refunds/`,
downstream of Ordering's frozen order snapshot — so when a refund test goes
red, there is exactly one folder in the universe to look in."

**Beat 4 · BDD — the shared dialect (2 min).**
```bash
npm run bdd
```
Open `specs/checkout-refunds/contracts/refunds.feature` side-by-side: the same
EARS criterion as Given-When-Then that the PO can read — and it *executes*, and
it *fails*, because nothing is implemented. One oracle, two dialects: the
Gherkin and the Jest spec bind to the same in-memory harness.

**Beat 5 · TDD + the gate (4 min).**
```bash
npm test          # RED — refunds.service.spec.ts, by design
```
Set the task: `echo "checkout-refunds T3" > .claude/state/ACTIVE_TASK`.
First, prove the gate: ask Claude to edit `src/payments/infrastructure/psp.ts` — the hook
answers with exit 2: *outside T3's declared resources.* Say: "a hook is
enforcement; a prompt is persuasion."
Then implement: `/implement T3` and let the agent drive red → green against
the contract (it's ~4 lines: `total.cents − fees.cents`, banker's rounding via
`Money.roundBankers`, per ADR-017 — mention the two-hour Sprint-14 story).
```bash
npm test && npm run bdd    # GREEN — both dialects agree
```

**Beat 6 · Verify (1 min).** `/verify checkout-refunds` — the EARS-2 row flips
to Green in `verification.md`; the exit gate opens. Close: "spec on the ticket
this morning; verified behavior now. That's the pipeline."

---

## §4 — Fallbacks & reset (do not skip)

- **Reset before every run:** `npm run demo:red && npm test` (must be RED),
  restore `ACTIVE_TASK`, `git checkout -- specs/` if you edited the spec live.
- **Agent slow or offline?** `npm run demo:green` swaps in
  `solution/refund-calculator.solution.ts` — narrate the diff instead of
  typing it. The audience still sees red → green.
- **Cucumber install trouble on the venue machine?** Skip Beat 4's run; show
  the .feature file and lean on the Jest suite — the story holds.
- **Total tooling failure?** Slides 10–11 ARE the demo (criterion → contracts
  → failing test → task). Present them, promise the repo, move on.

## §5 — Troubleshooting

| Symptom | Fix |
|---|---|
| `tsc` deprecation error on `moduleResolution` | you're on TS 6 globally — the repo pins TS 5.5 via `npm install`; use `npm run typecheck` |
| Hook doesn't block | `CLAUDE_PROJECT_DIR` unset when testing manually — run via Claude Code, or export it |
| Cucumber "no steps" | run from repo root; `cucumber.js` resolves paths relative to it |
| Jest can't find ts | `npm install` didn't finish — rerun; `typecheck:noinstall` needs nothing |
| Agent edits refused everywhere | `.claude/state/ACTIVE_TASK` missing — that's the gate working; set the task |

## §6 — What was verified where

Tested in a clean offline container: zero-dependency typecheck (stub **and**
solution), the gate's four modes (allow in-scope, block out-of-scope, allow
specs/docs, block without ACTIVE_TASK), demo:red/demo:green round-trip, JSON/
YAML validity, cucumber config load. Requires `npm install` on your machine
(not testable offline here): the jest run and the cucumber execution — both
use pinned, current versions; run §0's sanity checks the day before.

Spec first. Verify always — including this demo.
