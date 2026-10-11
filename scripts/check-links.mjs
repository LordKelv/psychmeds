#!/usr/bin/env node
// Fetches every source and reference URL in the dataset and reports ones that don't resolve.
// Usage: node scripts/check-links.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../src/data/disorders');
const urls = new Map(); // url -> [where]

for (const file of readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  const add = (url, where) => urls.set(url, [...(urls.get(url) ?? []), `${d.id}: ${where}`]);
  d.approved.forEach((t) => add(t.source.url, t.generic));
  d.offLabel.forEach((o) => o.references.forEach((r) => add(r.url, `off-label ${o.agent}`)));
}

const check = async (url) => {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'Mozilla/5.0 (link check)' },
    });
    return res.status;
  } catch (e) {
    return e.name === 'TimeoutError' ? 'timeout' : e.message;
  }
};

const entries = [...urls.keys()];
const failures = [];
const CONCURRENCY = 8;
for (let i = 0; i < entries.length; i += CONCURRENCY) {
  const batch = entries.slice(i, i + CONCURRENCY);
  const statuses = await Promise.all(batch.map(check));
  batch.forEach((url, j) => {
    if (statuses[j] !== 200) failures.push({ url, status: statuses[j], where: urls.get(url) });
  });
}

console.log(`Checked ${entries.length} URLs, ${failures.length} problem(s).`);
for (const f of failures) console.log(`\n[${f.status}] ${f.url}\n  ${f.where.join('\n  ')}`);
// 403/429 are often bot blocking (e.g., journal sites), not dead links, so report them without failing.
process.exit(failures.some((f) => f.status === 404 || typeof f.status === 'string') ? 1 : 0);
