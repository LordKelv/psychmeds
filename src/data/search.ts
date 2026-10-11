import { disorders, drugs, type DrugSummary } from '.';
import type { Disorder, OffLabelUse } from '../types';

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[®™]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** 3 = exact, 2 = prefix, 1 = word prefix or substring, 0 = no match. */
function score(query: string, candidates: string[]): number {
  let best = 0;
  for (const raw of candidates) {
    const c = normalize(raw);
    if (c === query) return 3;
    if (c.startsWith(query)) best = Math.max(best, 2);
    else if (c.includes(query)) best = Math.max(best, 1);
  }
  return best;
}

export interface SearchResults {
  disorders: Disorder[];
  drugs: DrugSummary[];
  offLabel: { disorder: Disorder; use: OffLabelUse }[];
}

const stripDiscontinued = (brand: string) => brand.replace(/\(.*?\)/g, '');

export function search(rawQuery: string): SearchResults {
  const query = normalize(rawQuery);
  if (query.length < 2) return { disorders: [], drugs: [], offLabel: [] };

  const rank = <T>(items: T[], keys: (item: T) => string[]) =>
    items
      .map((item) => ({ item, s: score(query, keys(item)) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.item);

  const matchedDrugs = rank([...drugs.values()], (d) => [d.generic, ...d.brands.map(stripDiscontinued), d.drugClass]);
  const matchedDrugIds = new Set(matchedDrugs.map((d) => normalize(d.generic)));

  const offLabel = disorders.flatMap((disorder) =>
    disorder.offLabel
      .filter((use) => score(query, [use.agent, use.drugClass ?? '']) > 0)
      .map((use) => ({ disorder, use })),
  );

  return {
    disorders: rank(disorders, (d) => [d.name, ...d.aliases]),
    drugs: matchedDrugs,
    // Off-label hits for a drug that also has approved results are still useful, but list them last.
    offLabel: offLabel.sort(
      (a, b) => Number(matchedDrugIds.has(normalize(a.use.agent))) - Number(matchedDrugIds.has(normalize(b.use.agent))),
    ),
  };
}
