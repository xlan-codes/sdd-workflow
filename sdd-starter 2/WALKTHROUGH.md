# WALKTHROUGH.md — one feature, end to end
### Feature → Spec (EARS) → DDD → Tasks → Architecture → BDD → TDD → Implement → Verify → DORA

This is the detailed companion to [DEMO.md](DEMO.md) (the 12-minute stage
script). Here, every stage of the pipeline is worked in full on one real
feature — **PLT-4821, partial refunds for cancelled events** — with the
reasoning, the patterns, and the artifacts. Follow it once and you can run the
method on any feature.

---

## §0 · We have a feature

It arrives, as features do, as a Jira ticket (`jira/PLT-4821.json`):

> **Summary:** Partial refund for cancelled events
> **Description:** When an event gets cancelled we need to refund the buyers.
> Refund the ticket price minus fees. Should be automatic, buyers shouldn't
> have to call support. Marketing wants this before the autumn on-sales.
> **AC:** refunds work for cancelled events.
> **Comment (PO):** "Fees = our service fees, not payment-provider fees. I think."
> **Comment (Support):** "Make sure people can't claim a refund twice."

Before touching anything, name the ambiguities. This ten-minute exercise is
the highest-leverage act in the whole pipeline:

| Vague phrase | The question nobody answered |
|---|---|
| "minus fees" | *Which* fees? Service fees? PSP fees? Both? (a comment says "…I think") |
| "automatic" | Triggered by what, exactly? Within what time? |
| "refunds work" | Untestable. What observable behaviour = "works"? |
| "can't claim twice" | What's the response to a duplicate? Silent no-op? Error? Which code? |
| (unstated) | What currency precision? Rounding rule on fee math? |
| (unstated) | Partial refunds per line item — now or later? |

Every one of these gaps *will* be filled by someone's assumption — a
developer's, a QA's, or an agent's, sampled fresh on every retry. The rest of
this document is the machinery that fills them **on purpose**.

---

## §1 · Design the spec — EARS

**Who & when:** the engineer drafts, the PO co-signs, QA reviews — inside the
existing refinement hour. Timebox: 45–60 min for a feature this size.
**Where:** `specs/checkout-refunds/spec.md`, from `templates/spec.template.md`
(or live: `/specify-from-jira PLT-4821`).

**The transformation.** Take each vague phrase through the interrogation and
land it in one of the five EARS patterns (skill: `ears-authoring`):

| Before (ticket) | Interrogation | After (spec) |
|---|---|---|
| "refund the ticket price minus fees" | which fees? when? | **EARS-2 (Event):** WHEN an event is cancelled, the system shall refund the ticket price minus *service fees* within 5 business days. |
| implied money handling | floats? rounding? | **EARS-1 (Ubiquitous):** The refunds API shall return amounts in minor units (cents). |
| "can't claim twice" | duplicate response? | **EARS-3 (State):** WHILE a refund is PENDING or ISSUED, further refund requests for that order shall be rejected with `409`. |
| (security hygiene) | expired token? | **EARS-4 (Unwanted):** IF the access token is expired, THEN the API shall return `401` with `WWW-Authenticate`. |
| "partial refund" in the title | now? | **EARS-5 (Optional):** WHERE partial refunds are enabled, the system shall support line-item refunds. → flagged out of this slice. |

**Rules enforced while writing:**
1. Every criterion passes the **litmus test** — *if you can't write the failing
   test, rewrite the criterion.* (EARS-2 passes: the test is in §6. "Refunds
   work" never could.)
2. **Non-functionals as numbers:** p95 issuance ≤ 300 ms (excl. PSP); zero
   double refunds under retry.
3. **Scope has an Out-list:** notification wiring (→ T4), refund UI (→ T5),
   line-item refunds (behind flag, later). Gold-plating dies here, in writing.
4. **Open questions must reach zero before planning.** Ours had two:
   *which fees* (PO confirms: service fees, from the order snapshot) and
   *rounding on fractional fee math* (decided: banker's, half-to-even — logged
   as **ADR-017**, because a decision that isn't written gets re-litigated).

Exit gate: spec.md approved in review, Open questions **empty**. Only now does
`/plan` unlock.

---

## §2 · DDD — place the feature in the domain

Strategic design answers *where does this live and what language does it
speak* — before any class diagram. Fifteen minutes of lightweight event
storming on the flow surfaces the domain events:

```
EventCancelled → RefundRequested → RefundCalculated → RefundIssued → BuyerNotified
```

**Bounded contexts** (full map in `docs/ddd.md`): Ordering owns orders and
their frozen totals; Payments owns money movement; **Refunds owns refund
policy** — the math, the state machine, the idempotency; Notification owns
outbound messages. The calculator therefore lives in the Refunds context —
`src/refunds/` — and nowhere else. One context, one folder: when a refund
contract goes red, there is exactly one directory to open.

**Context mapping.** Refunds is *downstream-conformist* to Ordering: totals
and service fees come **frozen on the order snapshot**, never recomputed from
live fee config (this single decision kills a whole class of "fees changed
mid-refund" bugs). Refunds is *upstream* to Notification: it publishes
`refund.issued` v1 and knows nothing about templates.

**Ubiquitous language** — the same nouns from the PO's mouth to the code:
*service fees* (ours, on the snapshot — the "…I think" comment, now decided),
*ISSUED/PENDING* (refund states; duplicates → 409), *minor units* (integer
cents everywhere). These words appear verbatim in spec.md, in the Gherkin, in
the type names, and in the test descriptions. That is the point.

**Tactical sketch (lands in `plan.md`):** the *Refund* is the aggregate,
keyed by `orderId` (which is what makes idempotency trivial); `Money` is a
value object; the calculator is a pure domain service. Risks table: fee model
varies by market → mitigated by the snapshot decision; double refunds under
retry → mitigated by EARS-3 + the keyed aggregate.

---

## §3 · Split it into tasks

Slicing method: **vertical slices** that each ship alone, ordered so a
*walking skeleton* exists early. Rules (the tasks command refuses to break
them): every task is **1 : 1 : 1** — one EARS criterion, one contract, one
ticket; sizes **S (≤ ½ day) or M (≤ 1 day), never L** — an L is a splitting
instruction; every task declares `Touches:` globs for the resource gate.

Derivation — criterion → contract → task (`specs/checkout-refunds/tasks.md`):

| Task | From | Contract | Size | Why this slice |
|---|---|---|---|---|
| T1 · fixtures & harness | EARS-1 | feature background | S | walking skeleton: gives every later test its verbs |
| T2 · endpoint skeleton | EARS-3 | OpenAPI 201/409 | S | contract-first: FE can mock *today*; 409 path proven early |
| T3 · **refund calculation** | EARS-2 | POST + "refund on cancellation" scenario | M | the domain heart — the demo's live task |
| T4 · refund.issued event | (out-of-scope wiring) | event schema v1 | S | isolates Notification coupling |
| T5 · status UI slice | scope §2 | pact checkout-web ↔ orders-svc | M | consumer-driven contract pair |
| T6 · expired-token guard | EARS-4 | OpenAPI 401 | S | unwanted-behaviour pattern gets its own slice |

Critical path: T1 → T2 → T3; T4/T6 hang off it; T5 parallel via the Pact stub.
Estimation summary: **4×S + 2×M ≤ 4 dev-days**, with **1.5 days of review &
verification bandwidth booked first** — with agents typing, verification is
the constraint, so it gets capacity before development does. Notice what
happened to estimation: it became **counting**.

---

## §4 · Architecture — patterns & principles, applied

The shape is **hexagonal (ports & adapters)** with a **functional core and an
imperative shell** — chosen not for fashion but because every principle below
buys a measurable debugging or testing property. The code in `src/refunds/`
mirrors this exactly:

```
            ┌────────────────────────── Refunds bounded context ─────────────────────────┐
            │  DOMAIN (pure — no I/O)          APPLICATION                ADAPTERS        │
  HTTP ───▶ │  RefundCalculator                RefundsService             controller      │
            │  Money (value object)            (idempotency, state,   ◀─  in-memory store │
            │                                   orchestration)            event recorder  │
            │        ▲ depends on nothing         ▲ depends on PORTS ─────────┘           │
            │        └── ports.ts: OrderSnapshotPort · RefundRepository · RefundEventsPort │
            └─────────────────────────────────────────────────────────────────────────────┘
```

Principle by principle — each with its payoff:

- **SRP (Single Responsibility).** `RefundCalculator` computes an amount.
  Nothing else — no storage, no events, no HTTP. Payoff: the T3 test is four
  lines and deterministic.
- **Functional core, imperative shell** (Bernhardt). The calculator and
  `Money` are pure; all I/O lives in the service + adapters. Payoff: bugs in
  refund *math* reproduce on a laptop in milliseconds — never "only in
  staging, around noon." Purity is search-space compression.
- **DIP (Dependency Inversion) + DI.** `RefundsService` depends on the three
  **ports** (interfaces in `ports.ts`), never on Dynamo, HTTP or the bus.
  `main.ts` is the *composition root* — wiring only. Payoff: swap a fake in
  one line and answer "my logic or their service?" in one test run.
- **ISP (small interfaces).** Three narrow ports instead of one god
  `Repository`. Payoff: test doubles are five lines; adapters can't grow
  hidden coupling.
- **Value objects / make illegal states unrepresentable.** `Money` holds
  *integer cents* and throws on anything else; refund status is a closed
  union. Payoff: the float-drift and half-cent bugs from the origin story
  don't sneak past review — they **don't compile**.
- **Idempotency as a domain rule, not middleware.** The Refund aggregate is
  keyed by `orderId`; the service's first act is a store lookup → `409`
  (EARS-3). Payoff: retries, double-clicks and replayed events are all the
  same non-event.
- **Domain events at the seam.** The service publishes `refund.issued` v1
  through the events port; Notification subscribes. Payoff: T4 ships without
  touching T3's code — the Out-list made physical.
- **One decision, one place, one record.** Rounding happens once, in
  `Money.roundBankers`, cited by **ADR-017**. Payoff: the next engineer who
  "fixes" 2.5 → 3 by intuition finds the ADR, not a debate.
- **OCP, gently.** New refund policies (line-item, EARS-5) extend by a new
  calculator behind the same call shape — no modification of the verified
  path. We do *not* pre-build the abstraction: the flag stays in the spec
  until it's real. (Patterns are applied where they pay, not collected.)
- **CQS.** `calculate()` answers; `requestRefund()` changes state and reports.
  No method does both quietly.

Tests attach at two seams: **domain** (calculator: pure unit tests — fast,
exhaustive) and **application** (service against in-memory adapters: the
Gherkin and the 409 path). The HTTP adapter is covered by the OpenAPI
contract; the cross-service promise by Pact (T5). Every layer has exactly one
kind of test, and every test knows which layer it accuses when it fails.

---

## §5 · Create the BDD

BDD is the **shared dialect**: the EARS criteria, re-expressed as
Given-When-Then that the PO can read *and* the pipeline can execute. The
translation is nearly mechanical — that's a feature:

| EARS | Gherkin (in `contracts/refunds.feature`) |
|---|---|
| EARS-2: WHEN an event is cancelled… | *Given* a paid order for event "EVT-303" · *When* the event is cancelled · *Then* a refund is issued for price minus service fees · *And* the order status is "REFUNDED" |
| EARS-3: WHILE PENDING/ISSUED… 409 | *Given* the order already has a refund · *When* a refund is requested again · *Then* the request is rejected with status 409 |

**Rules for scenarios that stay healthy:** declarative, domain-language steps
(*"the event is cancelled"* — never "click the cancel button"); one behaviour
per scenario; shared setup in `Background:`; ubiquitous-language nouns only.
If a scenario needs UI verbs, it's testing the wrong layer.

**Step definitions** (`features/steps/refunds.steps.ts`) bind the scenarios to
the **same in-memory harness the unit tests use** — one oracle, two dialects.
Run: `npm run bdd` → both scenarios **fail**, correctly, because nothing is
implemented. Red BDD before code is the proof that the scenarios can detect
absence — the same logic as TDD's red, one level up.

---

## §6 · Create the TDD

The failing test is derived **from the contract, never from the
implementation** (there is no implementation). For T3, the contract names the
oracle and the test writes itself (`src/refunds/application/refunds.service.spec.ts`):

```ts
it("refunds price minus fees when the event is cancelled", async () => {
  const order = await paidOrder("EVT-303");
  await events.cancel("EVT-303");
  expect(await refundFor(order.id)).toEqual(
    order.total.minus(order.fees)   // RED — no implementation yet (T3)
  );
});
```

Run `npm test` → **RED**, with `NotImplemented — task T3`. This failure is an
asset: it proves the detector works. A test written after the code passes *by
construction* and proves nothing — which is why the discipline is:

1. **Red** — smallest failing test from the contract. No production code
   without one.
2. **Green** — the *minimum* to pass. Resist generality; the next red test
   earns it (triangulation: EARS-1's minor-units test and the 409 test pin the
   edges the first test doesn't).
3. **Refactor** — only while green: names to ubiquitous language, extract, de-dupe.
4. Repeat until the task's `Done:` line is literally true.

**Agent-assisted variant:** set the leash — `echo "checkout-refunds T3" >
.claude/state/ACTIVE_TASK` — then `/implement T3`. The agent runs the same
loop; the human reviews every diff **against the criteria** (conformance, not
style). Try an edit outside `Touches:` and the hook answers exit 2: a hook is
enforcement; a prompt is persuasion.

---

## §7 · Implement

The green for T3 is deliberately anticlimactic — the whole pipeline exists to
make it so (`solution/refund-calculator.solution.ts`, or live-typed):

```ts
export class RefundCalculator {
  calculate(order: Order): Money {
    const cents = Money.roundBankers(order.total.cents - order.fees.cents);
    return Money.ofCents(cents);   // EARS-2 · minor units per EARS-1 · ADR-017
  }
}
```

Commentary: integer-cent subtraction is exact, so today the rounding guard is
a no-op — it exists because ADR-017 says *all* refund math passes through one
audited rounding point, so tomorrow's percentage-fee change can't reintroduce
the origin-story bug. The function stays pure: the service (imperative shell)
owns the store lookup → 409, the state transition, and the `refund.issued`
publish — all behind ports.

Discipline while implementing: **the Out-list is law** — T4's event templates
and T5's UI stay untouched even when "it would only take a minute"; anything
learned that contradicts the spec goes back as an **open question or ADR**,
never a silent interpretation. Then:

```bash
npm test && npm run bdd    # GREEN — both dialects agree on the same oracle
```

---

## §8 · Verify

Verification is the exit gate — conformance made explicit, in
`specs/checkout-refunds/verification.md` (or `/verify checkout-refunds`):

1. **Criteria coverage table** — every EARS row maps to named green tests.
   EARS-2 flips `Red — T3 open` → **Green**. EARS-5 stays `—` (out of slice,
   *documented* as such).
2. **Per-task evidence** — suite names, results, and **deviations → ADRs**
   (T3's row cites ADR-017: decided up-front, not during coding).
3. **Verdict** — `CONFORMS — <date>` only when every in-scope row is green;
   one red row and the feature does not merge — it reopens the spec or the
   task, visibly.
4. **First-pass entry** — did this task conform without rework? That single
   boolean, aggregated, is the purest spec-quality metric you will ever own.

The demo *is* the verification: run the live slice behind its flag. No
screenshots. If Verify found a gap, the spec — not the definition of done —
would have changed, and the loop tightens instead of drifting.

---

## §9 · And at the end — DORA (plus the two SDD signals)

Metrics close the loop from *practice* to *proof*. **DORA — DevOps Research &
Assessment** — four measures, each with its exact definition here and the
mechanism by which this pipeline moves it:

| DORA metric | Measured here as | How this pipeline moves it | Instrument from |
|---|---|---|---|
| **Lead time for changes** | spec-approved → running in prod | ≤1-day slices kill queueing; contracts unblock parallel FE/BE/QA (PLT-4821: **4.2 days median** spec→verified) | board timestamps (Spec col → Done) |
| **Deployment frequency** | deploys/week | small batches behind flags → daily merges of verified slices | CI/CD pipeline events |
| **Change failure rate** | % deploys causing incident/rollback | contracts catch regressions **pre-prod**; Red never ships as "known issue" | incident tracker ÷ deploys |
| **MTTR** (mean time to restore) | failure → restored | thin slices = thin rollbacks; a red contract test *names the folder* (localize → reproduce → bisect) | incident timestamps |

**The two SDD-native signals** (leading indicators DORA can't see):

- **First-pass verification** = tasks conforming without rework ÷ total.
  Sprint 14: **81 %**, target 90. Falls out of §8's boolean — zero extra
  tooling. When it dips, the retro reads *which spec section* failed.
- **Contract coverage** = EARS criteria with executable tests ÷ total.
  At Sprint-14 close: **4/4 in-scope** (EARS-5 consciously excluded). The Sprint-15 amendment (EARS-6/7) and the new `wallet-credit` spec enter *uncovered* — coverage dips at every sprint boundary and recovers as their tasks land: the dip is the signal working. Drift downward
  = spec rot, detected before the incident detects it for you.

#### Beyond DORA — SPACE, DevEx and GSM, worked with the same sprint

**SPACE** — sample ≥ 3 dimensions, always including one perceptual (survey)
measure. ✓ marks the three this team samples:

| Dim. | Question it answers | Worked example (Sprint 14) | Instrument | Sampled |
|---|---|---|---|---|
| **S** · Satisfaction & well-being | Do people feel good about how work works? | Spec-quality pulse: **4.2 / 5** ("criteria were clear before I started") | 5-question pulse | ✓ (perceptual) |
| **P** · Performance | Outcomes, not effort | First-pass verification: **81 %** | verification.md | optional |
| **A** · Activity | Output volume (context, never a target) | **20 verified tasks** | board count | ✓ |
| **C** · Communication & collaboration | Does knowledge flow? | Specs co-authored PO + engineer: **6 / 6** | spec review log | optional |
| **E** · Efficiency & flow | How much waiting between steps? | Wait Contract → Red: **3 h median** | board timestamps | ✓ |

**DevEx** — pair every *perception* with a *workflow* measure; feelings are data too:

| Driver | What it captures | Perception (pulse) | Workflow (system) |
|---|---|---|---|
| **Feedback loops** | How fast the system answers you | "I get test/review results quickly" — **4.5 / 5** | suite **2 m 40 s** · review turnaround **4 h** |
| **Cognitive load** | How hard it is to think here | "It's easy to know exactly what to build" — **4.1 / 5** | new dev → first **verified** task: **3 days** |
| **Flow state** | How often deep work survives the calendar | "I get uninterrupted focus time" — **3.9 / 5** | WIP = **1** → **0** mid-task handoffs |

**GSM** — Goal → Signal → Metric, strictly in that order; two worked chains:

| Step | Rule | Chain 1 — spec quality | Chain 2 — review bottleneck | Goodhart trap avoided |
|---|---|---|---|---|
| **Goal** | In words; no numbers yet | Refunds ship with zero rework caused by ambiguity | Verification never starves the pipeline | starting from "what's easy to count" |
| **Signal** | How you'd *know*, even if unmeasurable | Verified work rarely reopens | Finished work rarely waits on review | mistaking activity for the goal |
| **Metric** | A measurable *proxy*, held loosely | First-pass **81 %** (→ 90) · reopened: **1** | Wait Green → Verify: **4 h median** (< 1 day) | optimizing the proxy (rushed reviews) |

One instrumentation pass — the board, `verification.md`, and the five-question
pulse — feeds all three frameworks *and* DORA: watch the pipeline, watch the
humans, keep the "why" honest.

#### Can Jira track these? Mostly yes — here's the split

Precondition for everything: the Jira workflow statuses must mirror the
pipeline columns (*Spec → Contract → In Progress → Green → Verify → Done/
Released*), because the issue **changelog timestamps every transition** — and
those timestamps are the metrics.

| Metric | In Jira? | How (Data Center) |
|---|---|---|
| Lead time | **Yes — best source** | changelog: *Spec approved* → *Released*; Kanban **Control Chart** out of the box, or a nightly `/rest/api/2/search?expand=changelog` job / Time-in-Status app |
| First-pass verification | **Yes — easiest** | Automation rule: transition *Verify → In Progress* adds label `rework`; then `status = Done AND labels != rework` ÷ all Done |
| MTTR | **Yes, if incidents are issues** | Incident issue type; created → resolved (or a *Restored* status) via resolution reports/JQL |
| Change failure rate | **Partially** | numerator: incidents **linked** to the causing release/story (linking discipline is the whole game); denominator (deploys) must be mirrored in |
| Deployment frequency | **Mirror from CI** | CD job calls Jira REST on each prod deploy (transition to *Released* / `deployed` label), or GitLab-for-Jira feeds the development panel; counting stays truthful in GitLab |
| Contract coverage | **No — CI owns it** | a CI step counts `EARS-n` IDs in specs vs. test annotations and posts to a dashboard gadget; source of truth stays in git |

Step-by-step configuration for all of this — workflow statuses, the
Automation rule, the CI jobs and the scheduled dashboard script — is in
**[METRICS-SETUP.md](METRICS-SETUP.md)**.

Working architecture, matching "instrument once": **Jira = workflow clock**
(lead time, first-pass, MTTR) · **GitLab CI = delivery clock** (frequency,
coverage) · incidents-as-issues bridge the two for CFR · one nightly REST
script joins them into the dashboard. Caveat to say out loud: Jira only
measures what people actually transition — batch-moving tickets on Friday
turns lead time into fiction, which is exactly why an SDD board helps: status
is *test status*, driven by the pipeline's reality, not by memory.

**Operating rules:** capture the **baseline before the pilot** (this month),
re-measure after two sprints, judge **trends per team — never absolutes across
teams**, and never at individual level (Goodhart's law: the fastest way to
turn a measurement program into a gaming program). One instrumentation pass —
the board, CI events, `verification.md`, and a 5-question pulse — feeds DORA
today and SPACE/DevEx/GSM (deck slides 26–27) tomorrow.

### Worked example — the dashboard after two SDD sprints, with numbers

Baseline captured over Sprints 11–12 (pre-pilot, same team of five); re-measured
over Sprints 13–14 (the pilot). Same board, same CI, same incident tracker —
only the practice changed.

| Metric | Baseline · S11–12 | SDD pilot · S13–14 | Δ |
|---|---|---|---|
| **Lead time** (spec-approved → prod, median) | 9.0 days | **4.2 days** | −53 % |
| **Deployment frequency** | 2 / week | **8 / week** (16 deploys in 10 days, behind flags) | ×4 |
| **Change failure rate** | 18 % (7 incidents / 39 deploys) | **6 %** (1 / 16) | −12 pp |
| **MTTR** | ~6 h (multi-slice rollbacks, log archaeology) | **40 min** (flag-off + red test named the folder) | −89 % |
| *First-pass verification* (SDD) | — (not measurable pre-pilot) | 74 % → **81 %** (S13 → S14; target 90) | +7 pp |
| *Contract coverage* (SDD) | 0 % | **93 %** (38 / 41 in-scope EARS criteria) | +93 pp |

Where each number came from — no new tooling, just the artifacts this repo
already produces:

- **Lead time:** board timestamps, `Spec approved` → `Verified in prod`. The
  five verified Sprint-14 stories took 3.1 · 3.8 · **4.2** · 4.6 · 5.0 days —
  median 4.2 (PLT-4830, rolled, is excluded from the median and *visible* as a
  roll, not hidden inside an average).
- **Deployment frequency:** CI deploy events. Twenty verified tasks merged
  behind flags produced 16 production deploys in 10 working days.
- **CFR:** incident tracker ÷ deploys. The one pilot incident was a flag
  misconfiguration — notably *not* a contract regression; the contracts caught
  those pre-merge (PLT-4830's rounding gap cost 2 h, not an incident).
- **MTTR:** flag-off restored service in 40 minutes; the failing contract test
  pointed at `src/refunds/` before the call ended — localize → reproduce →
  bisect, as designed.

#### Reading the table — what each number actually says

**Did they improve? Yes — all six.** "Better" points in different directions,
so read the arrows with this rule:

| Direction of good | Metrics | What happened | Verdict |
|---|---|---|---|
| **Lower is better** | Lead time · Change failure rate · MTTR | 9.0→4.2 d · 18→6 % · 6 h→40 min — all **down** | ✓ improved |
| **Higher is better** | Deployment frequency · First-pass verification · Contract coverage | 2→8 /wk · 74→81 % · 0→93 % — all **up** | ✓ improved |

The strongest signal is the pair that normally *fights*: deploying more often
usually means breaking more often. Here frequency rose ×4 **while** failure
rate fell — improving both sides of that trade-off at once is what tells you
the process, not luck, did it.

- **Lead time (median), 9.0 → 4.2 days (−53 %).** Clock time from *spec
  approved* to *running in production* — the full journey of one slice,
  including all the waiting. It's a **median** on purpose: half of all items
  now arrive within 4.2 days, and one disaster story can't hide inside an
  average. The mechanism behind the drop is not faster typing — it's less
  queueing, because one-day slices don't wait behind each other.
- **Deployment frequency, 2 → 8 / week (×4).** How often code reaches
  production (16 deploys in 10 working days). "Behind flags" matters: each
  deploy is dark until the flag flips, so shipping often ≠ exposing users
  often. Frequency is really a proxy for **batch size** — you can only deploy
  8× a week if changes are small, and small changes are the easy ones to
  review, test and undo.
- **Change failure rate, 18 % → 6 % (−12 pp).** Of all deploys, the fraction
  that caused an incident or rollback: 7/39 before, 1/16 after. **pp =
  percentage points**, the absolute gap between two percentages (18 − 6 = 12) —
  written that way because "−12 %" would ambiguously suggest a relative drop.
  The *shape* of the remaining failure matters too: a flag misconfig, not a
  contract regression — that class died pre-merge (2 h, not an outage).
- **MTTR, ~6 h → 40 min (−89 %).** Mean Time To Restore: when a deploy does
  fail, detection → healthy again. Forty minutes is what "designed for
  debugging" buys — flag-off restores instantly, and the red contract test
  names the folder. MTTR reframes risk: the goal isn't never failing; it's
  making failure *cheap*.
- **First-pass verification, 74 → 81 % (target 90).** Share of tasks that
  passed verification **without rework** — 17 of 21 right the first time.
  The purest spec-quality signal there is: a first-pass failure almost always
  traces to an ambiguity that survived spec review. No baseline exists because
  the gate itself didn't exist before the pilot.
- **Contract coverage, 0 → 93 %.** 38 of 41 in-scope EARS criteria have an
  executable test bound to them; the missing three are named, not forgotten.
  Watch the **direction** more than the level — drifting down means specs are
  outrunning tests: the early smell of spec rot.

One meta-observation for the Q&A: all six move for the *same underlying
reason* — smaller, unambiguous, verified slices — which is what makes them
credible together. If only one had moved, be suspicious.

Read it honestly: two sprints is a **direction, not a proof** — the deltas are
large partly because the baseline was soft. Keep the same instruments running,
report the trend per team every sprint, and let first-pass verification climb
toward 90 % before declaring victory. The dashboard's job is to make the next
argument about data instead of vibes.

---

## Appendix · stage → artifact → command

| Stage | Artifact | Command / file |
|---|---|---|
| Feature arrives | `jira/PLT-4821.json` | `scripts/jira-fetch.sh` (live) |
| Spec (EARS) | `specs/…/spec.md` | `/specify-from-jira PLT-4821` |
| DDD | `plan.md`, `docs/ddd.md` | `/plan checkout-refunds` |
| Tasks | `tasks.md` | `/tasks checkout-refunds` |
| Architecture | `src/refunds/application/ports.ts`, `refunds.service.ts`, `docs/code-structure.md` | — |
| BDD | `contracts/refunds.feature`, `features/steps/` | `npm run bdd` |
| TDD (red) | `refunds.service.spec.ts` | `npm test` |
| Implement | `refund-calculator.ts` | `/implement T3` (`demo:green` fallback) |
| Verify | `verification.md` | `/verify checkout-refunds` |
| DORA | metrics table above | board + CI + verification.md |

Spec first. Verify always. Measure honestly.
