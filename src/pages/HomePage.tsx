import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { disordersByCategory, stats } from '../data';
import { search } from '../data/search';
import type { Disorder } from '../types';

function DisorderLink({ disorder }: { disorder: Disorder }) {
  const count = disorder.approved.length;
  return (
    <Link to={`/d/${disorder.id}`} className="disorder-link">
      <span className="disorder-link-name">{disorder.name}</span>
      <span className={count ? 'count-pill' : 'count-pill count-pill-none'}>
        {count ? `${new Set(disorder.approved.map((t) => t.drugId)).size} FDA-approved` : 'None FDA-approved'}
      </span>
    </Link>
  );
}

function SearchResultsView({ query }: { query: string }) {
  const results = useMemo(() => search(query), [query]);
  const empty = !results.disorders.length && !results.drugs.length && !results.offLabel.length;

  if (query.trim().length < 2) return <p className="muted">Keep typing…</p>;
  if (empty) return <p className="muted">No matches for “{query}”.</p>;

  return (
    <div className="search-results">
      {results.disorders.length > 0 && (
        <section>
          <h2 className="section-label">Disorders</h2>
          <div className="link-list">
            {results.disorders.map((d) => (
              <DisorderLink key={d.id} disorder={d} />
            ))}
          </div>
        </section>
      )}
      {results.drugs.length > 0 && (
        <section>
          <h2 className="section-label">Medications: FDA-approved indications</h2>
          {results.drugs.map((drug) => (
            <div key={drug.drugId} className="card result-drug">
              <div className="result-drug-head">
                <strong>{drug.generic}</strong>
                {drug.brands.length > 0 && <span className="muted"> ({drug.brands.join(', ')})</span>}
              </div>
              <div className="muted small">{drug.drugClass}</div>
              <ul className="result-indications">
                {[...new Map(drug.indications.map((i) => [i.disorder.id, i])).values()].map(({ disorder, treatment }) => (
                  <li key={disorder.id}>
                    <span className="badge badge-approved">FDA</span>{' '}
                    <Link to={`/d/${disorder.id}?drug=${encodeURIComponent(treatment.drugId)}`}>{disorder.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      {results.offLabel.length > 0 && (
        <section>
          <h2 className="section-label">Off-label uses (not FDA-approved)</h2>
          <div className="card offlabel-results">
            <ul className="result-indications">
              {results.offLabel.map(({ disorder, use }) => (
                <li key={`${disorder.id}-${use.agent}-${use.use}`}>
                  <span className="badge badge-offlabel">Off-label</span> <strong>{use.agent}</strong> for {use.use} in{' '}
                  <Link to={`/d/${disorder.id}?focus=off-label`}>{disorder.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

export default function HomePage() {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';

  if (query) return <SearchResultsView query={query} />;

  return (
    <>
      <section className="intro">
        <h1>FDA-indicated psychiatric medications</h1>
        <p className="muted">
          {stats.disorders} conditions · {stats.drugs} medications. Pick a condition to see every medication the FDA has
          approved for it. Off-label options are listed separately and clearly marked.
        </p>
      </section>
      {disordersByCategory.map(({ category, disorders }) => (
        <section key={category} className="category">
          <h2 className="section-label">{category}</h2>
          <div className="link-list">
            {disorders.map((d) => (
              <DisorderLink key={d.id} disorder={d} />
            ))}
          </div>
        </section>
      ))}
      {disordersByCategory.length === 0 && <p className="muted">No data yet.</p>}
    </>
  );
}
