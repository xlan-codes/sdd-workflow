# METRICS-SETUP.md — configuring Jira & GitLab to track the DORA + SDD dashboard
### Step-by-step for Jira Data Center + self-managed GitLab (Cloud notes where they differ)

Goal: after this setup, the six-metric dashboard from
[WALKTHROUGH.md §9](WALKTHROUGH.md) computes itself — **Jira is the workflow
clock** (lead time, first-pass verification, MTTR, and the incident side of
CFR), **GitLab CI is the delivery clock** (deployment frequency, contract
coverage, and the deploy side of CFR), and one scheduled script joins them.

Time budget: ~2 hours once, per project. Everything below uses only built-in
features, Automation for Jira, and two scripts that ship in this repo
(`scripts/contract_coverage.sh`, `scripts/dora_dashboard.py`).

---

## Part A — Jira (Data Center)

### A1 · Workflow statuses that mirror the pipeline  *(prerequisite for everything)*

The changelog timestamps every status transition — those timestamps **are**
the metrics. So the workflow must speak the pipeline's language.

1. **Admin → Issues → Statuses:** create `Spec`, `Spec Approved`, `Contract`,
   `Green`, `Verify`, `Released` (you already have `In Progress` and `Done`).
   Categories: `Spec*`/`Contract` → *To Do*; `In Progress`/`Green`/`Verify` →
   *In Progress*; `Released`/`Done` → *Done*.
2. **Project → Workflow (edit in designer):** order them
   `Spec → Spec Approved → Contract → In Progress → Green → Verify → Done → Released`.
   Allow `Verify → In Progress` (the rework path — we *want* it visible), and
   a global transition to `Released` (CI will drive it, §B2).
3. **Board → Board settings → Columns:** map one status per column so the
   board reads exactly like deck slide 19: *Spec · Contract · In Progress
   (Red) · Green · Verify · Done*.

> Discipline note: Jira measures what people transition. If tickets get
> batch-moved on Friday, lead time is fiction. The SDD board resists this
> because status = test status — but say it out loud in the team kickoff.

### A2 · Lead time (spec-approved → released)

Nothing to install:

- **Quick read:** Board → **Reports → Control Chart** → set the columns from
  `Spec Approved` to `Released` → the median line is your lead time; watch the
  trend, not single points.
- **Exact numbers:** the nightly script (§C1) reads
  `/rest/api/2/search?expand=changelog` and computes the median from the first
  entry into `Spec Approved` to the first entry into `Released`.

### A3 · First-pass verification (the `rework` label rule)

One Automation rule makes rework self-recording:

1. **Project settings → Automation → Create rule.**
2. **Trigger:** Issue transitioned · From `Verify` · To `In Progress`.
3. **Action:** Edit issue → Labels → **add** `rework`.
4. Name it `SDD · mark rework`, scope: this project. Done.

Read it with two saved filters (Dashboard → two *Issue Statistics* or *Filter
Count* gadgets, or let §C1 compute the ratio):

```jql
-- all finished
project = PLT AND issuetype in (Story, Task) AND statusCategory = Done AND resolved >= -14d
-- finished first-pass
project = PLT AND issuetype in (Story, Task) AND statusCategory = Done AND resolved >= -14d
  AND (labels IS EMPTY OR labels != rework)
```

First-pass % = second count ÷ first count.

### A4 · Incidents → CFR numerator + MTTR

1. **Admin → Issues → Issue types:** add `Incident` (standard type) and add it
   to the project's scheme. Simple workflow `Open → Restored → Done` — or keep
   the default and treat *resolution* as restoration.
2. **Team rule (the whole game):** every production incident becomes an
   `Incident` issue **at detection time**, and gets an issue link
   `caused by → <the story or the Deployment issue>` (Admin → Issue linking:
   add link type `causes / caused by` if missing).
3. **MTTR** = mean(`resolutiondate` − `created`) over Incidents — the script
   computes it; the built-in *Average Resolution Time* gadget approximates it.

### A5 · Deployments in Jira (the CFR denominator + frequency mirror)

Jira DC has no native deployments feed (that's a Cloud feature), so CI puts
them there — two complementary conventions, both driven from GitLab in §B2:

- **One `Deployment` issue per production deploy** (Admin → Issue types: add
  `Deployment`). Counting them per week = deployment frequency inside Jira;
  linking incidents to them gives clean CFR.
- **Transition shipped stories to `Released`** so lead time ends at the truth.

### A6 · The dashboard

Jira Dashboard with: Control Chart link, the two first-pass filter counters,
*Created vs Resolved* for Incidents — plus the script's weekly table (§C1)
posted wherever the team reads (Slack/Confluence/CI artifact).

> **Jira Cloud differences:** Automation is built-in the same way; deployments
> can come natively from the GitLab for Jira Cloud app (development panel +
> deployments), so §A5's `Deployment` issues become optional; JQL identical.

---

## Part B — GitLab (self-managed)

### B0 · Connect GitLab ↔ Jira (dev panel + smart transitions)

GitLab project → **Settings → Integrations → Jira issues**: Web URL =
`https://jira.yourcompany.com`, auth = Jira PAT (Bearer). From now on any
commit/MR/branch containing `PLT-123` shows in the Jira issue's development
panel — and **smart commits** work:
`git commit -m "PLT-4821 verify green #transition Released"`.

### B1 · CI variables

GitLab project → **Settings → CI/CD → Variables** (masked, protected):

| Variable | Value |
|---|---|
| `JIRA_BASE_URL` | `https://jira.yourcompany.com` |
| `JIRA_TOKEN` | a service-account **PAT** (not a personal one) |
| `JIRA_PROJECT` | `PLT` |

### B2 · Deploy job → tell Jira (frequency + Released + CFR denominator)

Append to `.gitlab-ci.yml` — runs after every **production** deploy:

```yaml
notify-jira:
  stage: .post
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH && $CI_ENVIRONMENT_NAME == "production"'
  script:
    # 1 · one Deployment issue per prod deploy (the CFR denominator)
    - |
      curl -sfS -X POST "$JIRA_BASE_URL/rest/api/2/issue" \
        -H "Authorization: Bearer $JIRA_TOKEN" -H "Content-Type: application/json" \
        -d "{\"fields\":{\"project\":{\"key\":\"$JIRA_PROJECT\"},
             \"issuetype\":{\"name\":\"Deployment\"},
             \"summary\":\"deploy $CI_COMMIT_SHORT_SHA · $CI_PIPELINE_URL\",
             \"labels\":[\"env:prod\"]}}"
    # 2 · transition every story shipped in this deploy to Released
    - |
      for KEY in $(git log "$CI_COMMIT_BEFORE_SHA..$CI_COMMIT_SHA" --pretty=%s%b \
                   | grep -oE "$JIRA_PROJECT-[0-9]+" | sort -u); do
        TID=$(curl -sfS -H "Authorization: Bearer $JIRA_TOKEN" \
              "$JIRA_BASE_URL/rest/api/2/issue/$KEY/transitions" \
              | python3 -c 'import json,sys;ts=json.load(sys.stdin)["transitions"];print(next((t["id"] for t in ts if t["to"]["name"]=="Released"),""))')
        [ -n "$TID" ] && curl -sfS -X POST \
          "$JIRA_BASE_URL/rest/api/2/issue/$KEY/transitions" \
          -H "Authorization: Bearer $JIRA_TOKEN" -H "Content-Type: application/json" \
          -d "{\"transition\":{\"id\":\"$TID\"}}" || true
      done
```

Deployment frequency now exists in *both* systems: GitLab (pipelines on the
production environment — Deployments page / API) and Jira (`Deployment`
issues) — they must agree, which is itself a useful health check.

### B3 · Contract coverage job (the CI-owned SDD signal)

```yaml
contract-coverage:
  stage: test
  script:
    - scripts/contract_coverage.sh "${COVERAGE_MIN:-0}"
```

The script counts `EARS-n` IDs in `specs/*/spec.md` versus IDs referenced by
any `*.feature` or `*.spec.ts` (the repo's convention — a header line like
`Covers EARS-2 and EARS-3` or a test title `(EARS-1)` both count). On this
repo today it prints, truthfully:

```
contract coverage: 3/11 criteria (27%)
uncovered: EARS-4 EARS-5 EARS-6 EARS-7 EARS-101 EARS-102 EARS-103 EARS-104
```

…which is correct — and a lesson in one line: EARS-4 lands with T6; EARS-5 is
superseded by Amendment A1; EARS-6/7 arrived with the Sprint-15 amendment and
EARS-101…104 with the brand-new `wallet-credit` spec — their contracts land
with their tasks. **Coverage dips at every sprint boundary; the dip is the
signal working.** Watch it recover as tasks land. Set `COVERAGE_MIN` once the pilot stabilizes to make drift a red
pipeline instead of a surprise.

### B4 · Weekly dashboard (scheduled pipeline)

```yaml
dora-dashboard:
  stage: .post
  rules: [{ if: '$CI_PIPELINE_SOURCE == "schedule"' }]
  script:
    - python3 scripts/dora_dashboard.py --project "$JIRA_PROJECT" --days 14 | tee dora.txt
  artifacts: { paths: [dora.txt], expire_in: 90 days }
```

GitLab → **Build → Pipeline schedules → New**: cron `0 6 * * 1` (Monday
mornings). The script (stdlib-only, PAT auth) prints the table: lead-time
median from the changelog, deployments/week from `Deployment` issues, CFR =
incidents ÷ deployments, MTTR from incident resolution times, first-pass from
the `rework` label — contract coverage it defers to §B3's job.

---

## Part C — Sanity checks & operating rules

**C1 · Dry run the script** (from any machine that can reach Jira):

```bash
export JIRA_BASE_URL=https://jira.yourcompany.com JIRA_TOKEN=<PAT>
python3 scripts/dora_dashboard.py --project PLT --days 14
```

**C2 · Verify the plumbing, one item each:** move a test issue
`Verify → In Progress` and confirm the `rework` label appears; run one
production deploy and confirm a `Deployment` issue + a `Released` transition;
open the Control Chart and confirm the `Spec Approved → Released` span.

**C3 · Operating rules (from the walkthrough, they bear repeating):** capture
the **baseline before the pilot**; re-measure after two sprints; judge
**trends per team, never absolutes across teams**; never at individual level
(Goodhart's law); and when a number moves, ask *which spec section or pipeline
stage* moved it — that's the retro's job.

| Metric | Source of truth | Where configured |
|---|---|---|
| Lead time | Jira changelog | §A1–A2 |
| Deployment frequency | GitLab prod pipelines (mirrored to Jira) | §B2 (§A5) |
| Change failure rate | Jira Incidents ÷ Deployment issues | §A4–A5, §B2 |
| MTTR | Jira Incident timestamps | §A4 |
| First-pass verification | Jira `rework` label | §A3 |
| Contract coverage | git + CI | §B3 |

Instrument once. Argue with data.
