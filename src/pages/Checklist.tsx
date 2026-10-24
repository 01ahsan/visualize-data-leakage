import { useEffect } from 'react';
import { scenarioHash } from '../router';

const CHECKS: { title: string; detail: string; scenario: string }[] = [
  {
    title: 'No patient appears on both sides of a split.',
    detail: 'Use GroupKFold when one patient has several rows.',
    scenario: 'same-patient',
  },
  {
    title: 'Preprocessing is fitted on training data only.',
    detail: 'Put imputation, scaling and encoding in a Pipeline.',
    scenario: 'preprocessing',
  },
  {
    title: 'Feature selection runs inside cross-validation.',
    detail: 'Never select on all rows first.',
    scenario: 'feature-selection',
  },
  {
    title: 'Duplicates are removed before splitting.',
    detail: 'Check record IDs and merged sources.',
    scenario: 'duplicates',
  },
  {
    title: 'Every feature exists at prediction time.',
    detail: 'Drop anything recorded after the outcome.',
    scenario: 'target-leakage',
  },
  {
    title: 'Time-ordered data is split by time.',
    detail: 'Train on the past, test on what follows.',
    scenario: 'time-leakage',
  },
  {
    title: 'The test set is used once.',
    detail: 'Tune on validation data or with nested cross-validation.',
    scenario: 'test-set-tuning',
  },
  {
    title: 'Resampling touches training folds only.',
    detail: 'Oversampling and SMOTE stay out of the test fold.',
    scenario: 'oversampling',
  },
];

export function Checklist() {
  useEffect(() => {
    document.title = 'Checklist · Data Leakage Playground';
  }, []);
  return (
    <article className="checklist">
      <header className="checklist-head">
        <div>
          <h1>Leakage checklist</h1>
          <p className="lede">Eight questions before you trust a score.</p>
          <div className="print-fields" aria-hidden="true">
            <span>Project: ______________________________</span>
            <span>Date: ______________</span>
          </div>
        </div>
        <button type="button" className="cta no-print" onClick={() => window.print()}>
          Print
        </button>
      </header>
      <ol className="checks">
        {CHECKS.map((c, i) => (
          <li key={c.scenario}>
            <input type="checkbox" id={`check-${i}`} />
            <div>
              <label htmlFor={`check-${i}`} className="check-title">
                {c.title}
              </label>
              <p className="check-detail">
                {c.detail}{' '}
                <a className="no-print" href={scenarioHash(c.scenario)}>
                  Demo
                </a>
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="print-footer">
        Data Leakage Playground. Based on the Princeton leakage taxonomy and REFORMS checklist
        (reproducible.cs.princeton.edu). CC BY 4.0.
      </p>
    </article>
  );
}
