import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { disordersById } from '../data';
import { ApprovedCard, OffLabelCard } from '../components/TreatmentCard';
import type { ApprovedTreatment } from '../types';
import { useViewMode } from '../viewMode';

function groupBySection(treatments: ApprovedTreatment[], sections?: string[]) {
  const sorted = [...treatments].sort((a, b) => a.generic.localeCompare(b.generic));
  if (!sections) return [{ section: null, treatments: sorted }];
  return sections
    .map((section) => ({ section, treatments: sorted.filter((t) => t.section === section) }))
    .filter((g) => g.treatments.length > 0);
}

export default function DisorderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { mode } = useViewMode();
  const offLabelRef = useRef<HTMLElement>(null);
  const disorder = id ? disordersById.get(id) : undefined;
  const focusDrug = params.get('drug');

  useEffect(() => {
    if (params.get('focus') === 'off-label') offLabelRef.current?.scrollIntoView({ block: 'start' });
  }, [params]);

  if (!disorder) {
    return (
      <div>
        <p>Condition not found.</p>
        <Link to="/">← All conditions</Link>
      </div>
    );
  }

  const groups = groupBySection(disorder.approved, disorder.sections);
  const moleculeCount = new Set(disorder.approved.map((t) => t.drugId)).size;
  // Highlight only the first entry for the drug so the page scrolls to one place.
  const highlightIndex = focusDrug ? disorder.approved.findIndex((t) => t.drugId === focusDrug) : -1;
  const highlighted = highlightIndex >= 0 ? disorder.approved[highlightIndex] : null;

  return (
    <article className="disorder">
      <Link to="/" className="back-link">
        ← All conditions
      </Link>
      <header className="disorder-header">
        <div className="small muted">{disorder.category}</div>
        <h1>{disorder.name}</h1>
        {disorder.aliases.length > 0 && <div className="small muted">Also: {disorder.aliases.join(', ')}</div>}
        <p className="disorder-summary">{mode === 'plain' ? disorder.plainSummary : disorder.summary}</p>
        <nav className="jump-links">
          <a href="#" onClick={(e) => (e.preventDefault(), document.getElementById('approved')?.scrollIntoView())}>
            FDA-approved ({moleculeCount})
          </a>
          <a href="#" onClick={(e) => (e.preventDefault(), offLabelRef.current?.scrollIntoView())}>
            Off-label ({disorder.offLabel.length})
          </a>
        </nav>
      </header>

      <section id="approved" className="approved-section">
        <h2 className="block-title approved-title">FDA-approved for this condition</h2>
        {disorder.approved.length === 0 && (
          <div className="callout callout-none">
            <strong>No FDA-approved medication.</strong> {disorder.noApprovedNote}
          </div>
        )}
        {groups.map(({ section, treatments }) => (
          <div key={section ?? 'all'} className="treatment-group">
            {section && <h3 className="group-title">{section}</h3>}
            {treatments.map((t) => (
              <ApprovedCard
                key={`${t.drugId}-${t.section ?? ''}-${t.generic}`}
                treatment={t}
                highlighted={t === highlighted}
              />
            ))}
          </div>
        ))}
      </section>

      <section id="off-label" ref={offLabelRef} className="offlabel-section">
        <h2 className="block-title offlabel-title">Off-label uses: NOT FDA-approved for this condition</h2>
        <div className="callout callout-offlabel">
          These medications are used in clinical practice for this condition, but the FDA has <strong>not</strong>{' '}
          approved them for it. Evidence ranges from guideline-endorsed to limited, safety data may be sparse, and they
          should be used only after weighing the risks and benefits with a clinician.
        </div>
        {disorder.offLabel.length === 0 ? (
          <p className="muted">No commonly used off-label options listed.</p>
        ) : (
          disorder.offLabel.map((use) => <OffLabelCard key={`${use.agent}-${use.use}`} use={use} />)
        )}
      </section>

      <p className="small muted reviewed">Last reviewed {disorder.lastReviewed}</p>
    </article>
  );
}
