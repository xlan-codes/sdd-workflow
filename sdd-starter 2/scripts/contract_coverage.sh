#!/usr/bin/env bash
# Contract coverage: % of EARS criteria in specs/ that are referenced by an
# executable artifact (a *.feature file or a *.spec.ts test).
# Convention: reference the criterion ID (EARS-n) anywhere in the test/feature
# — a tag, a comment header ("Covers EARS-2 and EARS-3"), or a test title.
# Usage: scripts/contract_coverage.sh [COVERAGE_MIN]   (exit 1 if below min %)
set -euo pipefail
MIN="${1:-0}"

mapfile -t ALL < <(grep -rhoE 'EARS-[0-9]+' specs/*/spec.md | sort -uV)
mapfile -t REF < <(grep -rhoE 'EARS-[0-9]+' --include='*.feature' --include='*.spec.ts' specs src 2>/dev/null | sort -uV)

covered=0; uncovered=()
for id in "${ALL[@]}"; do
  if printf '%s\n' "${REF[@]}" | grep -qx "$id"; then
    covered=$((covered+1))
  else
    uncovered+=("$id")
  fi
done
total=${#ALL[@]}
pct=$(( total > 0 ? covered * 100 / total : 100 ))

echo "contract coverage: ${covered}/${total} criteria (${pct}%)"
if [ ${#uncovered[@]} -gt 0 ]; then
  echo "uncovered: ${uncovered[*]}   (out-of-scope criteria are allowed to appear here — document them)"
fi
[ "$pct" -ge "$MIN" ] || { echo "FAIL: below COVERAGE_MIN=${MIN}%"; exit 1; }
