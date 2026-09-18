#!/usr/bin/env node
/**
 * Aggregate Claude Code headless JSON results into the comparison table.
 * Usage: node scripts/report.mjs <weakResultsDir> <strongResultsDir>
 * Reads every round*.json, sums usage, prints markdown to stdout.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function load(dir) {
  const rounds = readdirSync(dir).filter((f) => /^round\d+\.json$/.test(f)).sort();
  const acc = { rounds: rounds.length, in: 0, cacheRead: 0, cacheWrite: 0, out: 0, cost: 0, ms: 0, turns: 0 };
  for (const f of rounds) {
    const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
    const u = j.usage ?? {};
    acc.in += u.input_tokens ?? 0;
    acc.cacheRead += u.cache_read_input_tokens ?? 0;
    acc.cacheWrite += u.cache_creation_input_tokens ?? 0;
    acc.out += u.output_tokens ?? 0;
    acc.cost += j.total_cost_usd ?? 0;
    acc.ms += j.duration_ms ?? 0;
    acc.turns += j.num_turns ?? 0;
  }
  acc.tokens = acc.in + acc.cacheRead + acc.cacheWrite + acc.out;
  return acc;
}

const fmt = (n) => n.toLocaleString("en-US");
const mins = (ms) => `${Math.floor(ms / 60000)}m ${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}s`;
const x = (a, b) => (b > 0 ? (a / b).toFixed(1) + "×" : "—");

const [weakDir, strongDir] = process.argv.slice(2);
if (!weakDir || !strongDir) {
  console.error("usage: node scripts/report.mjs <weakResultsDir> <strongResultsDir>");
  process.exit(1);
}
const w = load(weakDir);
const s = load(strongDir);

console.log(`## Spec economics — weak vs strong spec, same feature, same model\n`);
console.log(`| Measure | Weak spec | Strong spec | Weak ÷ Strong |`);
console.log(`|---|---:|---:|---:|`);
console.log(`| Rounds to stakeholder-green | ${w.rounds} | ${s.rounds} | ${x(w.rounds, s.rounds)} |`);
console.log(`| Agent turns | ${w.turns} | ${s.turns} | ${x(w.turns, s.turns)} |`);
console.log(`| Fresh input tokens | ${fmt(w.in)} | ${fmt(s.in)} | ${x(w.in, s.in)} |`);
console.log(`| Cache read tokens | ${fmt(w.cacheRead)} | ${fmt(s.cacheRead)} | ${x(w.cacheRead, s.cacheRead)} |`);
console.log(`| Output tokens | ${fmt(w.out)} | ${fmt(s.out)} | ${x(w.out, s.out)} |`);
console.log(`| **Total tokens** | **${fmt(w.tokens)}** | **${fmt(s.tokens)}** | **${x(w.tokens, s.tokens)}** |`);
console.log(`| **Cost (USD)** | **$${w.cost.toFixed(2)}** | **$${s.cost.toFixed(2)}** | **${x(w.cost, s.cost)}** |`);
console.log(`| **Wall time** | **${mins(w.ms)}** | **${mins(s.ms)}** | **${x(w.ms, s.ms)}** |`);
function roundRows(dir, label) {
  const files = readdirSync(dir).filter((f) => /^round\d+\.json$/.test(f)).sort();
  if (files.length <= 1) return;
  console.log(`\n### Per-round detail — ${label}\n`);
  console.log(`| Round | Turns | Fresh in | Cache read | Out | Cost | Time |`);
  console.log(`|---|---:|---:|---:|---:|---:|---:|`);
  files.forEach((f, i) => {
    const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
    const u = j.usage ?? {};
    console.log(`| ${i + 1} | ${j.num_turns ?? 0} | ${fmt(u.input_tokens ?? 0)} | ${fmt(u.cache_read_input_tokens ?? 0)} | ${fmt(u.output_tokens ?? 0)} | $${(j.total_cost_usd ?? 0).toFixed(2)} | ${mins(j.duration_ms ?? 0)} |`);
  });
  console.log(`\n> Rounds 2+ are pure ambiguity tax — each one re-reads the whole session (watch the cache column climb).`);
}
roundRows(weakDir, "weak spec");

console.log(`\n> Headline: the strong spec finished in ${s.rounds} round(s) using ${x(w.tokens, s.tokens)} fewer tokens, ` +
            `${x(w.cost, s.cost)} cheaper and ${x(w.ms, s.ms)} faster than the weak spec.`);
console.log(`> Every weak-spec round after the first is the price of one ambiguity — paid in tokens, dollars and minutes.`);
