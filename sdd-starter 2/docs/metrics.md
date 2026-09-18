# Metrics: DORA + SDD, then SPACE · DevEx · GSM

## Pipeline (DORA) + spec health (SDD)
- Lead time (spec approved → prod) · Deployment frequency · Change failure
  rate · MTTR
- **First-pass verification** — % tasks conforming without rework (purest
  signal of spec quality)
- **Contract coverage** — % EARS criteria with executable tests (drift = rot)

## SPACE (Forsgren et al., 2021) — sample ≥ 3 dimensions, one perceptual
Example: S spec-quality pulse 4.2/5 · A 20 verified tasks/sprint ·
E wait Contract→Red 3 h median.

## DevEx (Noda, Storey, Forsgren, Greiler, 2023) — perceptions + workflows
Feedback loops: contract suite 2 m 40 s, review turnaround 4 h ·
Cognitive load: new dev → first verified task in 3 days (specs onboard) ·
Flow: WIP = 1 contract → zero mid-task handoffs.

## GSM (Goals · Signals · Metrics — SWE at Google) — start from the goal
GOAL refunds ship with zero ambiguity-rework → SIGNAL verified work rarely
reopens → METRIC first-pass 81 % · reopened-after-verify: 1.

**Instrument once:** the board, verification.md and a 5-question pulse survey
feed all three lenses. Baseline before the pilot; judge trends per team.
