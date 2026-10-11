import { CATEGORIES, type ApprovedTreatment, type Category, type Disorder } from '../types';

const modules = import.meta.glob<Disorder>('./disorders/*.json', { eager: true, import: 'default' });

export const disorders: Disorder[] = Object.values(modules).sort((a, b) => a.name.localeCompare(b.name));

export const disordersById = new Map(disorders.map((d) => [d.id, d]));

export const disordersByCategory: { category: Category; disorders: Disorder[] }[] = CATEGORIES.map((category) => ({
  category,
  disorders: disorders.filter((d) => d.category === category),
})).filter((g) => g.disorders.length > 0);

/** Every distinct molecule with an approved entry, keyed by drugId. */
export interface DrugSummary {
  drugId: string;
  generic: string;
  brands: string[];
  drugClass: string;
  indications: { disorder: Disorder; treatment: ApprovedTreatment }[];
}

export const drugs: Map<string, DrugSummary> = new Map();
for (const disorder of disorders) {
  for (const treatment of disorder.approved) {
    let drug = drugs.get(treatment.drugId);
    if (!drug) {
      drug = { drugId: treatment.drugId, generic: treatment.generic, brands: [], drugClass: treatment.drugClass, indications: [] };
      drugs.set(treatment.drugId, drug);
    }
    for (const brand of treatment.brands) if (!drug.brands.includes(brand)) drug.brands.push(brand);
    drug.indications.push({ disorder, treatment });
  }
}

export const stats = {
  disorders: disorders.length,
  drugs: drugs.size,
  approvedEntries: disorders.reduce((n, d) => n + d.approved.length, 0),
  lastReviewed: disorders.map((d) => d.lastReviewed).sort().at(-1) ?? null,
};
