#!/usr/bin/env node
// Validates disorder JSON files against the schema in src/types.ts.
// Usage: node scripts/validate-data.mjs [file ...]   (defaults to all files)

import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src/data/disorders');

const typesSrc = readFileSync(join(root, 'src/types.ts'), 'utf8');
const CATEGORIES = [...typesSrc.match(/CATEGORIES = \[([\s\S]*?)\] as const/)[1].matchAll(/'([^']+)'/g)].map(
  (m) => m[1],
);
const ROLES = ['monotherapy', 'adjunctive', 'monotherapy or adjunctive'];
const STATUSES = ['verified', 'partially-verified', 'unverified'];
const EVIDENCE = ['guideline-recommended', 'RCT-supported', 'limited'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync(dataDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => join(dataDir, f));

let errorCount = 0;
const seenIds = new Set();

for (const file of files) {
  const errors = [];
  const err = (path, msg) => errors.push(`${path}: ${msg}`);
  const str = (v, path, { optional = false } = {}) => {
    if (v === undefined && optional) return;
    if (typeof v !== 'string' || !v.trim()) err(path, 'must be a non-empty string');
  };
  const strArr = (v, path, { nonEmpty = false } = {}) => {
    if (!Array.isArray(v)) return err(path, 'must be an array');
    if (nonEmpty && !v.length) err(path, 'must not be empty');
    v.forEach((s, i) => str(s, `${path}[${i}]`));
  };
  const link = (v, path) => {
    if (!v || typeof v !== 'object') return err(path, 'must be an object {label, url}');
    str(v.label, `${path}.label`);
    if (typeof v.url !== 'string' || !/^https:\/\//.test(v.url)) err(`${path}.url`, 'must be an https URL');
  };

  let d;
  try {
    d = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`✗ ${file}\n  invalid JSON: ${e.message}`);
    errorCount++;
    continue;
  }

  const expectedId = basename(file, '.json');
  if (d.id !== expectedId) err('id', `must equal filename "${expectedId}"`);
  if (seenIds.has(d.id)) err('id', 'duplicate id');
  seenIds.add(d.id);
  str(d.name, 'name');
  strArr(d.aliases, 'aliases');
  if (!CATEGORIES.includes(d.category)) err('category', `must be one of: ${CATEGORIES.join(' | ')}`);
  str(d.summary, 'summary');
  str(d.plainSummary, 'plainSummary');
  if (d.sections !== undefined) strArr(d.sections, 'sections', { nonEmpty: true });
  if (!ISO_DATE.test(d.lastReviewed ?? '')) err('lastReviewed', 'must be YYYY-MM-DD');
  if (!Array.isArray(d.approved)) err('approved', 'must be an array');
  if (!Array.isArray(d.offLabel)) err('offLabel', 'must be an array');
  if (Array.isArray(d.approved) && d.approved.length === 0) str(d.noApprovedNote, 'noApprovedNote');

  (d.approved ?? []).forEach((t, i) => {
    const p = `approved[${i}]${t?.generic ? ` (${t.generic})` : ''}`;
    if (!SLUG.test(t.drugId ?? '')) err(`${p}.drugId`, 'must be a lowercase hyphenated slug');
    str(t.generic, `${p}.generic`);
    strArr(t.brands, `${p}.brands`);
    str(t.drugClass, `${p}.drugClass`);
    if (d.sections) {
      if (!d.sections.includes(t.section)) err(`${p}.section`, `must be one of disorder.sections`);
    } else if (t.section !== undefined) err(`${p}.section`, 'set disorder.sections before using section');
    str(t.indication, `${p}.indication`);
    if (!ROLES.includes(t.role)) err(`${p}.role`, `must be one of: ${ROLES.join(' | ')}`);
    if (!t.population || typeof t.population !== 'object') err(`${p}.population`, 'missing');
    else {
      str(t.population.ages, `${p}.population.ages`);
      if (typeof t.population.pediatric !== 'boolean') err(`${p}.population.pediatric`, 'must be boolean');
    }
    if (t.approvalYear !== null && !(Number.isInteger(t.approvalYear) && t.approvalYear > 1930 && t.approvalYear < 2100))
      err(`${p}.approvalYear`, 'must be a year or null');
    if (!t.dosing || typeof t.dosing !== 'object') err(`${p}.dosing`, 'missing');
    else {
      str(t.dosing.start, `${p}.dosing.start`);
      str(t.dosing.target, `${p}.dosing.target`);
      str(t.dosing.max, `${p}.dosing.max`);
      str(t.dosing.notes, `${p}.dosing.notes`, { optional: true });
    }
    strArr(t.formulations, `${p}.formulations`, { nonEmpty: true });
    strArr(t.boxedWarnings, `${p}.boxedWarnings`);
    strArr(t.contraindications, `${p}.contraindications`);
    if (t.rems !== null) str(t.rems, `${p}.rems`);
    if (t.controlledSubstance !== null && !/^C-(I|II|III|IV|V)$/.test(t.controlledSubstance ?? ''))
      err(`${p}.controlledSubstance`, 'must be null or C-I..C-V');
    if (typeof t.genericAvailable !== 'boolean') err(`${p}.genericAvailable`, 'must be boolean');
    str(t.plainSummary, `${p}.plainSummary`);
    link(t.source, `${p}.source`);
    if (!t.verified || typeof t.verified !== 'object') err(`${p}.verified`, 'missing');
    else {
      if (!ISO_DATE.test(t.verified.date ?? '')) err(`${p}.verified.date`, 'must be YYYY-MM-DD');
      if (!STATUSES.includes(t.verified.status)) err(`${p}.verified.status`, `must be one of: ${STATUSES.join(' | ')}`);
      str(t.verified.note, `${p}.verified.note`, { optional: true });
    }
  });

  (d.offLabel ?? []).forEach((o, i) => {
    const p = `offLabel[${i}]${o?.agent ? ` (${o.agent})` : ''}`;
    str(o.agent, `${p}.agent`);
    str(o.drugClass, `${p}.drugClass`, { optional: true });
    str(o.use, `${p}.use`);
    if (!EVIDENCE.includes(o.evidence)) err(`${p}.evidence`, `must be one of: ${EVIDENCE.join(' | ')}`);
    str(o.notes, `${p}.notes`);
    if (o.contextOnly !== undefined && o.contextOnly !== true) err(`${p}.contextOnly`, 'must be true when present');
    if (o.contextOnly) {
      if (o.details !== undefined) err(`${p}.details`, 'must be omitted when contextOnly is true');
    } else if (!o.details || typeof o.details !== 'object') err(`${p}.details`, 'missing (required unless contextOnly)');
    else {
      const x = o.details;
      const dp = `${p}.details`;
      str(x.labeledFor, `${dp}.labeledFor`);
      if (!x.dosing || typeof x.dosing !== 'object') err(`${dp}.dosing`, 'missing');
      else {
        str(x.dosing.start, `${dp}.dosing.start`);
        str(x.dosing.target, `${dp}.dosing.target`);
        str(x.dosing.max, `${dp}.dosing.max`);
        str(x.dosing.notes, `${dp}.dosing.notes`, { optional: true });
      }
      strArr(x.formulations, `${dp}.formulations`, { nonEmpty: true });
      strArr(x.boxedWarnings, `${dp}.boxedWarnings`);
      strArr(x.contraindications, `${dp}.contraindications`);
      strArr(x.warnings, `${dp}.warnings`, { nonEmpty: true });
      if (x.rems !== null) str(x.rems, `${dp}.rems`);
      if (x.controlledSubstance !== null && !/^C-(I|II|III|IV|V)\b/.test(x.controlledSubstance ?? ''))
        err(`${dp}.controlledSubstance`, 'must be null or start with C-I..C-V');
      if (typeof x.genericAvailable !== 'boolean') err(`${dp}.genericAvailable`, 'must be boolean');
      str(x.plainSummary, `${dp}.plainSummary`);
    }
    if (!Array.isArray(o.references) || !o.references.length) err(`${p}.references`, 'needs at least one reference');
    else o.references.forEach((r, j) => link(r, `${p}.references[${j}]`));
  });

  if (errors.length) {
    errorCount += errors.length;
    console.error(`✗ ${basename(file)}\n  ${errors.join('\n  ')}`);
  } else {
    console.log(`✓ ${basename(file)} (${d.approved.length} approved, ${d.offLabel.length} off-label)`);
  }
}

if (errorCount) {
  console.error(`\n${errorCount} error(s)`);
  process.exit(1);
}
