#!/usr/bin/env bash
# Fetch a Jira issue as JSON into jira/<KEY>.json
# Usage:   JIRA_BASE_URL=https://jira.example.com JIRA_TOKEN=xxxx scripts/jira-fetch.sh PLT-4821
# Works with Jira Data Center (PAT bearer) and Jira Cloud (use email:api-token with -u instead).
set -euo pipefail
KEY="${1:?usage: jira-fetch.sh ISSUE-KEY}"
: "${JIRA_BASE_URL:?set JIRA_BASE_URL, e.g. https://jira.example.com}"
: "${JIRA_TOKEN:?set JIRA_TOKEN (Personal Access Token)}"
curl -sfS \
  -H "Authorization: Bearer ${JIRA_TOKEN}" \
  -H "Accept: application/json" \
  "${JIRA_BASE_URL}/rest/api/2/issue/${KEY}?fields=summary,description,comment,labels,status,priority,issuetype" \
  -o "jira/${KEY}.json"
echo "wrote jira/${KEY}.json"
