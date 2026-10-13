# Data guide

Each disorder is one JSON file at `src/data/disorders/<id>.json` following the
`Disorder` interface in `src/types.ts`. Validate with:

```
node scripts/validate-data.mjs src/data/disorders/<id>.json
```

## Rules

1. **FDA label is the source of truth.** An `approved` entry exists only if the
   current US prescribing information (section 1, Indications and Usage) lists
   the indication. Check every entry against DailyMed
   (`https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=...`) or
   Drugs@FDA / an FDA approval letter. Put the URL you actually checked in
   `source.url`.
2. **Verification status is honest.**
   - `verified`: you opened the label (or FDA letter) and confirmed the indication, ages, and dosing.
   - `partially-verified`: you confirmed the indication but could not confirm every field (explain in `verified.note`).
   - `unverified`: you could not reach a primary source; explain why in `verified.note`.
   `verified.date` is the date you checked it (today).
3. **One entry per drug per indication.** If a drug has distinct indications within one
   disorder (e.g., quetiapine for bipolar depression and for maintenance), create separate
   entries with different `section`s. Combine formulations of the same molecule into one
   entry when they share the indication (list them in `formulations` and `brands`), but
   give long-acting injectables their own entry when their dosing differs
   (e.g., "aripiprazole (long-acting injectable)").
4. **`drugId`** is the lowercase hyphenated generic (`aripiprazole`, `olanzapine-samidorphan`,
   `dextromethorphan-bupropion`). Use the same `drugId` for the same molecule everywhere.
   LAIs may use e.g. `aripiprazole-lauroxil`.
5. **Indication wording** goes in `indication`: quote or closely paraphrase the label,
   including whether it's monotherapy or adjunctive (also set `role`).
6. **Population**: copy the age limits from the label; set `pediatric: true` if any age < 18 is approved.
7. **Dosing**: brief and indication-specific, from the label (e.g., start "2 mg/day", target
   "10–15 mg/day", max "30 mg/day"). Note titration, renal/hepatic, or CYP2D6 adjustments in `notes`.
   Use "N/A" only when a field genuinely doesn't apply (e.g., single fixed dose).
8. **Safety**: `boxedWarnings`: short phrases, one per warning (e.g.,
   "Increased mortality in elderly patients with dementia-related psychosis",
   "Suicidal thoughts and behaviors in children, adolescents, and young adults").
   `contraindications`: label contraindications, short. `rems`: REMS name or null.
   `controlledSubstance`: "C-II" etc. or null.
9. **Discontinued products**: include a molecule if an approved generic or brand is still
   marketed in the US. If the only product is discontinued, either omit it or note
   "(discontinued)" in the brand and explain in `verified.note`.
10. **Off-label** goes in `offLabel`, never in `approved`. Include only commonly used
    or guideline-recognized off-label options, each with ≥1 reference (guideline,
    meta-analysis, or major RCT; PubMed, journal, or society URL). Notes must be neutral,
    not prescriptive, and mention key cautions.
    `evidence`: `guideline-recommended` (named in a major guideline such as APA, VA/DoD, NICE, CANMAT, AASM),
    `RCT-supported` (positive RCTs or meta-analysis, not guideline-endorsed), `limited` (case series, mixed data).
    **Off-label details.** Every `offLabel` entry that names a medication also needs a `details` object
    (see `OffLabelDetails` in `src/types.ts`) so the card expands like an approved one:
    - `labeledFor`: what the FDA has approved the drug for, and that this use is not on the label.
    - `dosing` (`start`/`target`/`max`, optional `notes`): ranges reported in the cited guideline or trial, checked
      against the drug's labeled dosing for other indications. Do not present them as label text. For entries that
      cover several agents, name each agent in the strings.
    - `formulations`, `boxedWarnings`, `contraindications`: from the drug's own label. List a boxed warning only when
      you are sure it is boxed; otherwise put it in `warnings`.
    - `warnings`: short key cautions that are neither boxed nor contraindications.
    - `controlledSubstance` (may add agents in parentheses), `rems`, `genericAvailable`, and a dosing-free
      `plainSummary`.
    Reference rows that are not a medication (e.g., a general caution about drug treatment) set `contextOnly: true`
    and omit `details`.
11. **Disorders with no approved drug** still get a file: `approved: []`, a clear
    `noApprovedNote`, and the off-label options.
12. **Plain language**: `plainSummary` fields are 1–2 sentences at about an 8th-grade reading level,
    with no dosing.
13. **No invented URLs.** Every URL must be one you visited or got from search results.
14. `lastReviewed` = today's date.
