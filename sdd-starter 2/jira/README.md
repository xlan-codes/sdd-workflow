# jira/ — the demo's entry point

`PLT-4821.json` is a realistic Jira issue export: a vague one-line requirement,
an untestable acceptance criterion, and two half-decisions buried in comments
("fees = service fees… I think", "no double refunds"). That vagueness is the
point — the demo turns exactly this into executable EARS criteria.

## Getting a live ticket instead (optional)
- **REST (Jira Data Center / Cloud):** `scripts/jira-fetch.sh PLT-4821`
  (needs `JIRA_BASE_URL` and `JIRA_TOKEN` — a Personal Access Token).
- **Atlassian MCP:** add the server to `.mcp.json` (see DEMO.md §2B) and let
  Claude Code read the issue directly.
- **Offline (default for stage demos):** just use this JSON. No network, no
  credentials, no live-demo surprises.
