// Data schema for the compendium. One JSON file per disorder lives in
// src/data/disorders/<id>.json and is checked by scripts/validate-data.mjs.

export const CATEGORIES = [
  'Psychotic disorders',
  'Bipolar disorders',
  'Depressive disorders',
  'Anxiety disorders',
  'Obsessive-compulsive & related disorders',
  'Trauma- & stressor-related disorders',
  'Neurodevelopmental disorders',
  'Feeding & eating disorders',
  'Elimination disorders',
  'Substance-related & addictive disorders',
  'Sleep-wake disorders',
  'Neurocognitive disorders',
  'Medication-induced movement disorders',
  'Sexual dysfunctions',
  'Personality disorders',
  'Other neuropsychiatric conditions',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Role = 'monotherapy' | 'adjunctive' | 'monotherapy or adjunctive';

export type VerificationStatus = 'verified' | 'partially-verified' | 'unverified';

export type OffLabelEvidence = 'guideline-recommended' | 'RCT-supported' | 'limited';

export interface Link {
  label: string;
  url: string;
}

export interface Dosing {
  start: string;
  target: string;
  max: string;
  notes?: string;
}

export interface ApprovedTreatment {
  /** Lowercase hyphenated generic, e.g. "lisdexamfetamine" or "olanzapine-samidorphan". */
  drugId: string;
  generic: string;
  /** Brand names that carry this indication (include discontinued brands with "(discontinued)"). */
  brands: string[];
  drugClass: string;
  /** Groups treatments within a disorder; must be one of Disorder.sections when sections are defined. */
  section?: string;
  /** FDA label wording for this indication (quote or close paraphrase of section 1). */
  indication: string;
  role: Role;
  population: {
    /** e.g. "Adults", "Adults and pediatric patients 6 years and older". */
    ages: string;
    pediatric: boolean;
  };
  /** Year this specific indication was approved; null when it could not be confirmed. */
  approvalYear: number | null;
  dosing: Dosing;
  formulations: string[];
  boxedWarnings: string[];
  contraindications: string[];
  rems: string | null;
  /** DEA schedule, e.g. "C-II"; null if not controlled. */
  controlledSubstance: string | null;
  /** True when DEA scheduling is pending, rather than the drug being unscheduled. */
  controlledSubstancePending?: boolean;
  genericAvailable: boolean;
  /** One or two plain-language sentences for patients and families. */
  plainSummary: string;
  /** Primary label source, ideally a DailyMed drugInfo.cfm?setid=... URL. */
  source: Link;
  verified: {
    /** ISO date the entry was checked against the label. */
    date: string;
    status: VerificationStatus;
    note?: string;
  };
}

export interface OffLabelUse {
  agent: string;
  drugClass?: string;
  /** What the agent is used for within this disorder, e.g. "Nightmares". */
  use: string;
  evidence: OffLabelEvidence;
  /** Cautions and context; never phrased as a recommendation to prescribe. */
  notes: string;
  references: Link[];
}

export interface Disorder {
  /** Lowercase hyphenated slug; must equal the JSON filename. */
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  /** Clinician-facing one or two sentence overview. */
  summary: string;
  /** Plain-language overview for patients and families. */
  plainSummary: string;
  /** Optional ordered list of groupings for approved treatments, e.g. ["Acute mania/mixed", "Bipolar depression", "Maintenance"]. */
  sections?: string[];
  /** Required when approved is empty: explains that no FDA-approved medication exists. */
  noApprovedNote?: string;
  approved: ApprovedTreatment[];
  offLabel: OffLabelUse[];
  lastReviewed: string;
}
