<img src="assets/icon.svg" width="64" height="64" alt="">

# PsychMeds

A mobile-friendly compendium of FDA-approved medications for psychiatric and related neuropsychiatric conditions.
Pick a condition to see every medication with a labeled indication for it (indication wording, ages, dosing, boxed
warnings, REMS, label link). Off-label options appear in a separate, clearly marked section with evidence ratings and
references; each one expands to show reported dosing, formulations, boxed warnings, key cautions, and
contraindications. A Clinician / Plain-language toggle switches the level of detail.

## Development

```sh
npm install
npm run dev        # local dev server
npm run validate   # schema-check all data files
npm run build      # validate + typecheck + build to dist/
node scripts/check-links.mjs   # check that every source/reference URL resolves
```

It's a static site (Vite + React + TypeScript, hash routing), so `dist/` can be served from any static host.

## Data

One JSON file per condition in `src/data/disorders/`, following the schema in `src/types.ts` and the rules in
[docs/DATA_GUIDE.md](docs/DATA_GUIDE.md). Every approved entry records the label URL it was checked against plus a
verification status and date.

**For education only.** Not medical advice, and no substitute for the current prescribing information.
