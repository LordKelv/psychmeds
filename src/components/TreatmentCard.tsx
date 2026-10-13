import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ApprovedTreatment, OffLabelUse } from '../types';
import { useViewMode } from '../viewMode';

const STATUS_LABEL = {
  verified: 'Verified against label',
  'partially-verified': 'Partially verified',
  unverified: 'Not yet verified',
} as const;

const EVIDENCE_LABEL = {
  'guideline-recommended': 'Guideline-recommended',
  'RCT-supported': 'RCT-supported',
  limited: 'Limited evidence',
} as const;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export function ApprovedCard({ treatment: t, highlighted }: { treatment: ApprovedTreatment; highlighted: boolean }) {
  const { mode } = useViewMode();
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.open = true;
      ref.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [highlighted]);

  const plain = mode === 'plain';

  return (
    <details ref={ref} className={`card treatment${highlighted ? ' highlighted' : ''}`} id={`drug-${t.drugId}`}>
      <summary>
        <div className="treatment-head">
          <div>
            <span className="treatment-name">{t.generic}</span>
            {t.brands.length > 0 && <span className="treatment-brands"> {t.brands.join(', ')}</span>}
          </div>
          <span className="chevron" aria-hidden="true" />
        </div>
        <div className="badges">
          <span className="badge badge-approved">FDA-approved</span>
          {t.role !== 'monotherapy' && <span className="badge">{t.role === 'adjunctive' ? 'Adjunctive' : 'Mono or adjunct'}</span>}
          {t.population.pediatric && <span className="badge badge-peds">Pediatric</span>}
          {t.boxedWarnings.length > 0 && <span className="badge badge-boxed">Boxed warning</span>}
          {t.controlledSubstance && <span className="badge">{t.controlledSubstance}</span>}
          {t.controlledSubstancePending && <span className="badge">DEA schedule pending</span>}
          {t.rems && <span className="badge">REMS</span>}
          {t.genericAvailable && <span className="badge badge-subtle">Generic</span>}
        </div>
        {plain ? (
          <p className="treatment-plain">{t.plainSummary}</p>
        ) : (
          <p className="treatment-indication">{t.indication}</p>
        )}
        <div className="treatment-meta small muted">
          <span>{t.drugClass}</span>
          <span>{t.population.ages}</span>
        </div>
      </summary>

      <div className="treatment-body">
        {plain && (
          <Field label="FDA label wording">
            <p className="treatment-indication">{t.indication}</p>
          </Field>
        )}
        {!plain && (
          <Field label="Plain language">
            <p>{t.plainSummary}</p>
          </Field>
        )}

        {t.boxedWarnings.length > 0 && (
          <div className="boxed-warning">
            <div className="boxed-warning-title">Boxed warning</div>
            <ul>
              {t.boxedWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {!plain && (
          <Field label="Dosing (per label)">
            <dl className="dosing">
              <dt>Start</dt>
              <dd>{t.dosing.start}</dd>
              <dt>Target</dt>
              <dd>{t.dosing.target}</dd>
              <dt>Max</dt>
              <dd>{t.dosing.max}</dd>
            </dl>
            {t.dosing.notes && <p className="small">{t.dosing.notes}</p>}
          </Field>
        )}

        <Field label="Formulations">
          <p>{t.formulations.join(' · ')}</p>
        </Field>

        {!plain && t.contraindications.length > 0 && (
          <Field label="Contraindications">
            <ul className="tight">
              {t.contraindications.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Field>
        )}

        <dl className="facts small">
          <dt>Indication approved</dt>
          <dd>{t.approvalYear ?? 'Year not confirmed'}</dd>
          <dt>Generic available</dt>
          <dd>{t.genericAvailable ? 'Yes' : 'No'}</dd>
          <dt>Controlled substance</dt>
          <dd>{t.controlledSubstance ?? (t.controlledSubstancePending ? 'Pending DEA scheduling' : 'No')}</dd>
          <dt>REMS</dt>
          <dd>{t.rems ?? 'None'}</dd>
        </dl>

        <div className="source small">
          <a href={t.source.url} target="_blank" rel="noreferrer">
            {t.source.label} ↗
          </a>
          <span className={`status status-${t.verified.status}`}>
            {STATUS_LABEL[t.verified.status]} · {formatDate(t.verified.date)}
          </span>
          {t.verified.note && <p className="muted">{t.verified.note}</p>}
        </div>
      </div>
    </details>
  );
}

type ApprovedMatch = { generic: string; link: string };

/** `approved` is set when the same drug also has an FDA-approved indication for this condition. */
export function OffLabelCard({ use, approved }: { use: OffLabelUse; approved?: ApprovedMatch }) {
  const { mode } = useViewMode();
  const d = use.details;
  const plain = mode === 'plain';

  const badges = (
    <div className="badges">
      <span className="badge badge-offlabel">Off-label use</span>
      <span className={`badge evidence-${use.evidence}`}>{EVIDENCE_LABEL[use.evidence]}</span>
      {d && d.boxedWarnings.length > 0 && <span className="badge badge-boxed">Boxed warning</span>}
      {d?.controlledSubstance && <span className="badge">{d.controlledSubstance.split(' ')[0]}</span>}
      {d?.rems && <span className="badge">REMS</span>}
      {d?.genericAvailable && <span className="badge badge-subtle">Generic</span>}
    </div>
  );

  const alsoApproved = approved && (
    <p className="also-approved small">
      {approved.generic[0].toUpperCase() + approved.generic.slice(1)} <strong>is</strong> FDA-approved for this condition. This card covers a different,
      off-label use. <Link to={approved.link}>See the approved indication</Link>
    </p>
  );

  const references = (
    <ul className="refs small">
      {use.references.map((r) => (
        <li key={r.url}>
          <a href={r.url} target="_blank" rel="noreferrer">
            {r.label} ↗
          </a>
        </li>
      ))}
    </ul>
  );

  if (!d) {
    return (
      <div className="card offlabel">
        {badges}
        <div className="treatment-name">{use.agent}</div>
        {use.drugClass && <div className="small muted">{use.drugClass}</div>}
        {alsoApproved}
        <p>
          <strong>Used for:</strong> {use.use}
        </p>
        <p className="small">{use.notes}</p>
        {references}
      </div>
    );
  }

  return (
    <details className="card offlabel treatment">
      <summary>
        <div className="treatment-head">
          <span className="treatment-name">{use.agent}</span>
          <span className="chevron" aria-hidden="true" />
        </div>
        {badges}
        {use.drugClass && <div className="small muted">{use.drugClass}</div>}
        {alsoApproved}
        <p>
          <strong>Used for:</strong> {use.use}
        </p>
      </summary>

      <div className="treatment-body">
        {plain && (
          <Field label="Plain language">
            <p>{d.plainSummary}</p>
          </Field>
        )}

        <Field label="FDA labeling">
          <p>{d.labeledFor}</p>
        </Field>

        {d.boxedWarnings.length > 0 && (
          <div className="boxed-warning">
            <div className="boxed-warning-title">Boxed warning (on the drug's own label)</div>
            <ul>
              {d.boxedWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <Field label="Evidence and cautions">
          <p className="small">{use.notes}</p>
        </Field>

        {!plain && (
          <Field label="Reported off-label dosing (not FDA-labeled for this use)">
            <dl className="dosing">
              <dt>Start</dt>
              <dd>{d.dosing.start}</dd>
              <dt>Target</dt>
              <dd>{d.dosing.target}</dd>
              <dt>Max</dt>
              <dd>{d.dosing.max}</dd>
            </dl>
            {d.dosing.notes && <p className="small">{d.dosing.notes}</p>}
            <p className="small muted">
              Ranges come from the cited guidelines and trials and the drug&apos;s labeling for other uses. Confirm against current prescribing
              information and the references below before use.
            </p>
          </Field>
        )}

        <Field label="Formulations">
          <p>{d.formulations.join(' · ')}</p>
        </Field>

        <Field label="Key warnings">
          <ul className="tight">
            {d.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Field>

        {!plain && d.contraindications.length > 0 && (
          <Field label="Contraindications">
            <ul className="tight">
              {d.contraindications.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Field>
        )}

        <dl className="facts small">
          <dt>Generic available</dt>
          <dd>{d.genericAvailable ? 'Yes' : 'No'}</dd>
          <dt>Controlled substance</dt>
          <dd>{d.controlledSubstance ?? 'No'}</dd>
          <dt>REMS</dt>
          <dd>{d.rems ?? 'None'}</dd>
        </dl>

        <Field label="References">{references}</Field>
      </div>
    </details>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {children}
    </div>
  );
}
