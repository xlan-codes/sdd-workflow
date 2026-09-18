#!/usr/bin/env bash
# Resource-resolution gate (reference implementation).
# Blocks Write/Edit tool calls whose file_path falls outside the ACTIVE task's
# declared `Touches:` globs. Simplified on purpose — adapt to your pipeline.
#
# Contract with Claude Code hooks:
#   stdin  : JSON payload containing tool_input.file_path
#   exit 0 : allow      exit 2 : block (stderr is shown to the model)

set -euo pipefail
STATE_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/state/ACTIVE_TASK"

payload="$(cat)"
file_path="$(printf '%s' "$payload" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:[[:space:]]*"//; s/"$//')"

# No file path in this tool call -> nothing to gate.
[ -z "$file_path" ] && exit 0

# Editing specs, docs or templates is always allowed - they ARE the work.
case "$file_path" in
  *"/specs/"*|specs/*|*"/docs/"*|docs/*|*"/templates/"*|templates/*|*CLAUDE.md) exit 0 ;;
esac

if [ ! -f "$STATE_FILE" ]; then
  echo "resource_gate: no ACTIVE_TASK set (.claude/state/ACTIVE_TASK). Declare the task before editing source." >&2
  exit 2
fi

read -r feature task < "$STATE_FILE"
tasks_md="${CLAUDE_PROJECT_DIR:-.}/specs/${feature}/tasks.md"
if [ ! -f "$tasks_md" ]; then
  echo "resource_gate: ${tasks_md} not found for active task ${task}." >&2
  exit 2
fi

# Pull the `Touches:` globs from the active task's block in tasks.md.
globs="$(awk -v t="## ${task} " 'index($0, t)==1 {f=1} f && /Touches:/ {print; exit}' "$tasks_md" \
        | sed 's/.*Touches:[[:space:]]*//; s/(.*)//; s/\xc2\xb7.*//; s/Est:.*//' | tr ',' ' ')"
if [ -z "$globs" ]; then
  echo "resource_gate: task ${task} in ${feature} declares no Touches: - add them to tasks.md first." >&2
  exit 2
fi

rel="${file_path#${CLAUDE_PROJECT_DIR:-.}/}"
# set -f: keep globs as PATTERNS — without it the shell pathname-expands
# `src/refunds/**` into whatever files exist, and nested paths never match.
set -f
for g in $globs; do
  case "$rel" in $g) set +f; exit 0 ;; esac
done
set +f

echo "resource_gate: ${rel} is outside ${task}'s declared resources (${globs}). Split the task or update Touches: consciously." >&2
exit 2
