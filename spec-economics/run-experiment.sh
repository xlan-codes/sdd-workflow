#!/usr/bin/env bash
# spec-economics — run the same feature twice through Claude Code headless:
#   runs/weak   : vague ticket, oracle hidden, review-feedback loop (max rounds)
#   runs/strong : EARS spec + contract tests up front, single session
# then aggregate tokens / cost / time / rounds with scripts/report.mjs.
#
# Requirements: claude (Claude Code) authenticated, jq, node >= 20.
# Flags are isolated below — check `claude --help` if your version differs.
set -euo pipefail
cd "$(dirname "$0")"

MODEL="${MODEL:-claude-sonnet-4-6}"
MAX_ROUNDS="${MAX_ROUNDS:-5}"
CLAUDE_FLAGS=(--output-format json --model "$MODEL" --permission-mode acceptEdits
              --allowedTools "Read Write Edit Bash(node*) Bash(npm*)")

need() { command -v "$1" >/dev/null || { echo "missing: $1"; exit 1; }; }
need claude; need jq; need node

fresh_run_dir() { # $1 = weak|strong
  rm -rf "runs/$1"; mkdir -p "runs/$1/src" "runs/$1/test" "runs/$1/results"
  cp src/discount.js "runs/$1/src/"
  cp package.json "runs/$1/"
  if [ "$1" = strong ]; then cp test/oracle.test.mjs "runs/$1/test/contract.test.mjs"; fi
}

oracle() { # $1 = run dir → 0 if stakeholder truth satisfied
  cp test/oracle.test.mjs "$1/test/_oracle.test.mjs"
  ( cd "$1" && node --test > results/oracle.out 2>&1 ); local rc=$?
  rm -f "$1/test/_oracle.test.mjs"
  return $rc
}

echo "══ STRONG SPEC ══"
fresh_run_dir strong
( cd runs/strong && claude -p "$(cat ../../prompts/strong-spec.md)" \
    "${CLAUDE_FLAGS[@]}" > results/round1.json )
if oracle runs/strong; then echo "strong: GREEN in 1 round"; else echo "strong: oracle still red — inspect runs/strong"; fi

echo "══ WEAK SPEC ══"
fresh_run_dir weak
( cd runs/weak && claude -p "$(cat ../../prompts/weak-spec.md)" \
    "${CLAUDE_FLAGS[@]}" > results/round1.json )
SESSION=$(jq -r .session_id runs/weak/results/round1.json)
round=1
until oracle runs/weak; do
  round=$((round+1))
  [ "$round" -gt "$MAX_ROUNDS" ] && { echo "weak: gave up after $MAX_ROUNDS rounds (still red)"; break; }
  FEEDBACK="Stakeholder review found defects. Failing checks (fix src/discount.js accordingly, then stop):
$(grep -E "not ok|AssertionError|expected|actual|reason" runs/weak/results/oracle.out | head -30)"
  ( cd runs/weak && claude -p --resume "$SESSION" "$FEEDBACK" \
      "${CLAUDE_FLAGS[@]}" > "results/round${round}.json" )
done
[ "$round" -le "$MAX_ROUNDS" ] && echo "weak: GREEN after $round round(s)"

node scripts/report.mjs runs/weak/results runs/strong/results | tee results/report.md
echo
echo "full table: results/report.md"
