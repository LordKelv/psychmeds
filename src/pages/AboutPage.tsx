import { Link } from 'react-router-dom';
import { stats } from '../data';

export default function AboutPage() {
  return (
    <article className="prose">
      <Link to="/" className="back-link">
        ← All conditions
      </Link>
      <h1>About &amp; methodology</h1>
      <p>
        PsychMeds lists the medications the U.S. Food and Drug Administration (FDA) has approved for each major
        psychiatric and closely related neuropsychiatric condition. It is meant as a quick reference for clinicians,
        trainees, patients, and families.
      </p>
      <h2>What “FDA-approved” means here</h2>
      <p>
        A medication appears under <em>FDA-approved</em> only if its current U.S. prescribing information (section 1,
        Indications and Usage) names that condition. Each entry links to the label it was checked against and shows
        whether it was fully verified, partially verified, or not yet verified, along with the date it was checked.
      </p>
      <h2>Off-label uses</h2>
      <p>
        Off-label uses are common in psychiatry and are often supported by guidelines and trials, but they are{' '}
        <strong>not FDA-approved</strong>. They appear in a separate, amber-colored section for each condition, with an
        evidence rating and references:
      </p>
      <ul>
        <li>
          <strong>Guideline-recommended</strong>: named in a major guideline (e.g., APA, VA/DoD, NICE, CANMAT, AASM).
        </li>
        <li>
          <strong>RCT-supported</strong>: positive randomized trials or meta-analyses, but not guideline-endorsed.
        </li>
        <li>
          <strong>Limited evidence</strong>: case series, small or mixed trials.
        </li>
      </ul>
      <h2>Limitations</h2>
      <p>
        Labels change. Dosing here is summarized and indication-specific, and it leaves out many details (renal and
        hepatic adjustment, drug interactions, monitoring). Always consult the full, current prescribing information and
        use clinical judgment. This site is not medical advice.
      </p>
      <p className="muted small">
        {stats.disorders} conditions · {stats.drugs} medications · {stats.approvedEntries} labeled indications
        {stats.lastReviewed && ` · data last reviewed ${stats.lastReviewed}`}
      </p>
    </article>
  );
}
