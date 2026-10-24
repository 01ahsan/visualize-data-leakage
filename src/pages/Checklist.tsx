import { useEffect } from 'react';
import { scenarioHash } from '../router';

const CHECKS: { title: string; detail: string; scenario: string }[] = [
  {
    title: 'No person (or other unit) appears on both sides of a split.',
    detail: 'Split by patient, site or device with GroupKFold when one unit has several rows.',
    scenario: 'same-patient',
  },
  {
    title: 'Every preprocessing step is fitted on training data only.',
    detail: 'Imputation, scaling and encoding live inside a Pipeline that cross-validation refits.',
    scenario: 'preprocessing',
  },
  {
    title: 'Feature selection happens inside the cross-validation loop.',
    detail:
      'Selecting features on all rows, then cross-validating, can make pure noise look predictive.',
    scenario: 'feature-selection',
  },
  {
    title: 'Duplicates and near-duplicates are removed or grouped before splitting.',
    detail: 'Check record ids, merged sources and repeated measurements.',
    scenario: 'duplicates',
  },
  {
    title: 'Every feature is available at the moment of prediction.',
    detail:
      'Drop anything recorded after the outcome, such as treatments, discharge codes or length of stay.',
    scenario: 'target-leakage',
  },
  {
    title: 'Time-ordered data is split by time.',
    detail: 'Train on the past, test on a later period, as the model will be used.',
    scenario: 'time-leakage',
  },
  {
    title: 'The test set is used once, after every choice is made.',
    detail: 'Tune models, features and thresholds on validation data or nested cross-validation.',
    scenario: 'test-set-tuning',
  },
  {
    title: 'Resampling is applied to training folds only.',
    detail: 'Oversampling, undersampling and SMOTE never touch the test fold.',
    scenario: 'oversampling',
  },
];

export function Checklist() {
  useEffect(() => {
    document.title = 'Leakage checklist · Data Leakage Playground';
  }, []);
  return (
    <article className="checklist">
      <header>
        <h1>Data leakage checklist</h1>
        <p className="lede">Eight checks to run before you trust a validation score.</p>
        <div className="print-fields" aria-hidden="true">
          <span>Project: ______________________________</span>
          <span>Date: ______________</span>
        </div>
        <button type="button" className="button no-print" onClick={() => window.print()}>
          Print this checklist
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
                  See the demo
                </a>
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="muted small print-footer">
        From Data Leakage Playground. Based on the leakage taxonomy and REFORMS checklist from
        Princeton (reproducible.cs.princeton.edu). Text licensed CC BY 4.0.
      </p>
    </article>
  );
}
