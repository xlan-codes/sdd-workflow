# The SDD workflow

Specify → Plan → Tasks → **Contracts become executable tests** → Implement
(Red → Green → Refactor) → Verify → Register. Gaps found in Verify reopen the
spec — the loop tightens instead of drifting.

## Why (the cost curve)
The same defect costs ~1× at spec review, ~10× in implementation, ~100× in
production (Boehm's heuristic). Agents add a second axis: a wrong spec is
regenerated at machine speed — every retry re-bills the same ambiguity in
tokens and review time. 30–50 % of effort in low-spec teams is rework.

## Gates
- **Entry:** no approved spec + contracts → nothing is estimated or started.
- **Mid:** `Open questions` must be empty before `plan.md`; `Touches:` before code.
- **Exit:** `verification.md` CONFORMS + ADRs logged → merge; anything Red reopens.

## Pros & cons (the honest ledger)
**Gain:** ambiguity dies early · parallel-by-contract · AI-ready ("done" is
executable) · reviewable intent · predictable planning.
**Cost:** +15–35 % upfront (TDD data) · discipline (hence hooks) · learning
curve (EARS/Gherkin) · overkill for throwaway spikes · spec-rot risk (Verify
is the antidote). Verdict: a bounded cost up front deletes an unbounded one later.
