#!/usr/bin/env bash
# spec-economics — THE command. Runs the weak-vs-good-spec demo end to end
# and prints the statistics.
#
#   ./demo.sh --offline    rehearsal mode: no API calls, uses recorded sample runs
#   ./demo.sh              live mode: runs Claude Code twice (needs claude + jq)
set -euo pipefail
cd "$(dirname "$0")"
MODE="${1:-live}"

step() { printf '\n\033[1m══ STEP %s · %s ══\033[0m\n\n' "$1" "$2"; }

step 1 "THE FEATURE — one function, eight silent decisions"
echo "applyDiscount(subtotalCents, code, catalog, now)"
echo "Hidden decisions: rounding · clamp-below-zero · caps · case-sensitivity"
echo "                  expiry · minimum order · error shapes · money units"

step 2 "THE TWO SPECS — read them aloud, that's the experiment"
echo "--- prompts/weak-spec.md (the ticket as it arrives) -------------------"
sed -n '1,8p' prompts/weak-spec.md
echo
echo "--- prompts/strong-spec.md (after one refinement hour) ----------------"
sed -n '1,14p' prompts/strong-spec.md
echo "  …plus EARS-1..8 and the contract tests handed over up front."

step 3 "THE REFEREE — the stakeholder's truth is executable"
echo "test/oracle.test.mjs: 8 asserts. Hidden from the weak run (plays the"
echo "reviewer); given to the strong run as the contract (that IS the method)."

if [ "$MODE" = "--offline" ]; then
  step 4 "RUNNING BOTH CONDITIONS (offline: recorded sample runs)"
  rm -rf runs/weak runs/strong
  mkdir -p runs/weak/results runs/strong/results
  cp results/sample/weak/*.json runs/weak/results/
  cp results/sample/strong/*.json runs/strong/results/
  echo "weak run   : 4 rounds until the reviewer was satisfied  (recorded)"
  echo "strong run : 1 round — contract green on first pass     (recorded)"
else
  step 4 "RUNNING BOTH CONDITIONS (live — this spends real tokens)"
  ./run-experiment.sh
fi

step 5 "THE STATISTICS"
node scripts/report.mjs runs/weak/results runs/strong/results | tee results/report.md
printf '\nSaved: results/report.md — screenshot the table; say the headline.\n'
