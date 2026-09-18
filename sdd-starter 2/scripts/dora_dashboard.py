#!/usr/bin/env python3
"""
dora_dashboard.py — compute the DORA + SDD dashboard from Jira Data Center.

Stdlib only (urllib). Auth: Personal Access Token (Bearer).

  export JIRA_BASE_URL=https://jira.yourcompany.com
  export JIRA_TOKEN=<PAT>
  python3 scripts/dora_dashboard.py --project PLT --days 14

Expects the conventions from METRICS-SETUP.md:
  - workflow statuses include "Spec Approved" and "Released" (names configurable below)
  - rework is marked with label `rework` (Automation rule)
  - incidents are issuetype = Incident
  - each production deploy creates an issuetype = Deployment issue
Deployment frequency and contract coverage are better sourced from GitLab CI;
this script covers the Jira-side four and prints placeholders for the rest.
"""
import argparse
import json
import os
import ssl
import statistics
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

STATUS_START = os.environ.get("DORA_STATUS_START", "Spec Approved")
STATUS_DONE = os.environ.get("DORA_STATUS_DONE", "Released")


def jira(path: str, params: dict | None = None) -> dict:
    base = os.environ["JIRA_BASE_URL"].rstrip("/")
    url = base + path + (("?" + urllib.parse.urlencode(params)) if params else "")
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {os.environ['JIRA_TOKEN']}",
        "Accept": "application/json",
    })
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return json.load(r)


def search(jql: str, fields: str = "created,resolutiondate", expand: str = "") -> list[dict]:
    issues, start = [], 0
    while True:
        page = jira("/rest/api/2/search", {
            "jql": jql, "fields": fields, "expand": expand,
            "startAt": start, "maxResults": 100,
        })
        issues += page.get("issues", [])
        start += 100
        if start >= page.get("total", 0):
            return issues


def ts(s: str) -> datetime:
    return datetime.strptime(s[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)


def status_entry_times(issue: dict) -> dict[str, datetime]:
    """First time the issue ENTERED each status, from the changelog."""
    entered: dict[str, datetime] = {}
    for h in issue.get("changelog", {}).get("histories", []):
        for item in h.get("items", []):
            if item.get("field") == "status":
                to = item.get("toString", "")
                entered.setdefault(to, ts(h["created"]))
    return entered


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--days", type=int, default=14)
    a = ap.parse_args()
    since = (datetime.now(timezone.utc) - timedelta(days=a.days)).strftime("%Y-%m-%d")
    P, rows = a.project, []

    # 1 · Lead time: Spec Approved -> Released (fallback: created -> resolved)
    done = search(
        f'project = {P} AND issuetype in (Story, Task) AND status = "{STATUS_DONE}" '
        f'AND resolved >= "{since}"', expand="changelog")
    leads = []
    for i in done:
        e = status_entry_times(i)
        start = e.get(STATUS_START) or ts(i["fields"]["created"])
        end = e.get(STATUS_DONE) or (ts(i["fields"]["resolutiondate"]) if i["fields"].get("resolutiondate") else None)
        if end:
            leads.append((end - start).total_seconds() / 86400)
    rows.append(("Lead time (median, days)",
                 f"{statistics.median(leads):.1f}" if leads else "n/a", f"{len(leads)} items"))

    # 2 · Deployment frequency: Deployment issues per week
    deploys = search(f'project = {P} AND issuetype = Deployment AND created >= "{since}"', fields="created")
    rows.append(("Deployments / week", f"{len(deploys) / (a.days / 7):.1f}", f"{len(deploys)} in {a.days}d"))

    # 3 · Change failure rate: Incidents / Deployments
    incidents = search(f'project = {P} AND issuetype = Incident AND created >= "{since}"')
    cfr = f"{100 * len(incidents) / len(deploys):.0f}%" if deploys else "n/a"
    rows.append(("Change failure rate", cfr, f"{len(incidents)} incidents / {len(deploys)} deploys"))

    # 4 · MTTR: mean created -> resolved of Incidents
    restored = [((ts(i["fields"]["resolutiondate"]) - ts(i["fields"]["created"])).total_seconds() / 3600)
                for i in incidents if i["fields"].get("resolutiondate")]
    rows.append(("MTTR (mean, hours)",
                 f"{statistics.mean(restored):.1f}" if restored else "n/a", f"{len(restored)} restored"))

    # 5 · First-pass verification: Done without `rework` label
    fp = search(f'project = {P} AND issuetype in (Story, Task) AND statusCategory = Done '
                f'AND resolved >= "{since}" AND (labels IS EMPTY OR labels != rework)', fields="created")
    alldone = search(f'project = {P} AND issuetype in (Story, Task) AND statusCategory = Done '
                     f'AND resolved >= "{since}"', fields="created")
    rows.append(("First-pass verification",
                 f"{100 * len(fp) / len(alldone):.0f}%" if alldone else "n/a",
                 f"{len(fp)}/{len(alldone)} done without rework"))

    # 6 · Contract coverage: sourced from CI (scripts/contract_coverage.sh)
    rows.append(("Contract coverage", "see CI", "scripts/contract_coverage.sh in the pipeline"))

    w = max(len(r[0]) for r in rows)
    print(f"\nDORA + SDD dashboard · project {P} · last {a.days} days\n" + "-" * (w + 28))
    for name, val, note in rows:
        print(f"{name.ljust(w)}  {val:>8}   {note}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
