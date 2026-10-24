# Launch materials

Replace `YOUR-GITHUB-USERNAME` with the account that hosts the repository before posting.

- Site: https://YOUR-GITHUB-USERNAME.github.io/data-leakage-playground/
- Code: https://github.com/YOUR-GITHUB-USERNAME/data-leakage-playground

All numbers below are from the default settings (seed 42) and can be reproduced on the site.

---

## Show HN

**Title:** Show HN: Data Leakage Playground – toggle ML leaks and watch the test score inflate

**Text:**

I made a small static site for teaching data leakage in machine learning. Each of eight scenarios runs a simulation in the browser with a Leaky/Correct switch. It shows three numbers: the score the analysis would report, the score of the same final model on a freshly generated "new hospital" dataset, and the gap between them.

Some results at default settings (ROC AUC):

- Feature selection on all rows, with 1,000 pure-noise features and coin-flip labels: reported 0.89, new data 0.50. Selecting inside the folds reports 0.51.
- Random split when patients have 4 visits each: reported 0.91, new patients 0.73. GroupKFold reports 0.76.
- Oversampling the minority class before splitting: reported 0.99, new data 0.84.

Not every leak is dramatic. Fitting the imputer and scaler on all rows changes the score by less than 0.01 in my simulation, and the page says that rather than inflating it.

Each scenario has short wrong and right scikit-learn snippets that run as is, a gap chart across a strength slider, share links that encode the exact state, and an iframe embed for course pages.

Technical details: Vite + React + TypeScript. Logistic regression, k-NN and ROC AUC are written by hand in TypeScript and run in a Web Worker. The data comes from a seeded PRNG, so everyone sees the same numbers. There is no backend, no cookies and no analytics. It is MIT licensed, and the text is CC BY 4.0. The scenarios follow Kapoor and Narayanan's leakage taxonomy and the REFORMS checklist.

I'd like feedback on whether the simulations are fair, and which leaks are missing.

---

## r/MachineLearning

**Title:** [P] Data Leakage Playground: interactive, in-browser simulations of 8 leakage types with wrong/right scikit-learn code

**Body:**

I built an open-source teaching tool for data leakage: https://YOUR-GITHUB-USERNAME.github.io/data-leakage-playground/

**What it does.** Each scenario simulates a study on synthetic data and reports two scores:

1. the cross-validated (or test) score the analysis would publish;
2. the score of the final model on an independently generated dataset from the same population (the "new hospital"; for the time scenario it is the next period).

A toggle switches between the leaky and the correct workflow, and a slider changes the strength of the leak.

**Scenarios and default results (ROC AUC, leaky reported → new data; correct reported):**

| Scenario                                              | Leaky       | Correct |
| ----------------------------------------------------- | ----------- | ------- |
| Same patient in train and test (k-NN)                 | 0.91 → 0.73 | 0.76    |
| Preprocessing on all data                             | 0.64 → 0.65 | 0.64    |
| Feature selection on all data (random labels)         | 0.89 → 0.50 | 0.51    |
| Duplicate records (30% re-entered)                    | 0.91 → 0.79 | 0.81    |
| Target leakage (post-outcome feature)                 | 1.00 → 0.77 | 0.75    |
| Time leakage (concept drift, random vs forward split) | 0.87 → 0.75 | 0.76    |
| Tuning on the test set (20 settings, 60 test rows)    | 0.68 → 0.62 | 0.61    |
| Oversampling before splitting                         | 0.99 → 0.84 | 0.81    |

**Notes on honesty.** Preprocessing leakage (mean imputation and scaling) is close to zero here, even at 20 rows. Test-set tuning gives a moderate 0.04–0.10 depending on the seed. Correct-mode gaps are sampling noise, usually within ±0.05. The test suite checks the leaky gap and the correct gap for every scenario, so a change that fakes an effect or hides one fails CI.

**Implementation.** TypeScript implementations of logistic regression (batch GD, L2) and k-NN (exact k-d tree for low-dimensional data), mean per-fold AUC like `cross_val_score`, a seeded mulberry32 PRNG, a Web Worker for the computation, and hand-written SVG charts. It is a static site on GitHub Pages with no tracking. Each scenario includes short wrong and right Python snippets, which I ran against scikit-learn 1.8.

Code (MIT): https://github.com/YOUR-GITHUB-USERNAME/data-leakage-playground

Feedback welcome, especially on simulation design and on leaks worth adding (for example, normalisation across sites or label leakage through identifiers).

---

## LinkedIn

A validation score is only as good as the split behind it.

I built Data Leakage Playground, a free, open-source site that shows eight common ways information from the test set leaks into training. You switch each leak on and off and compare the score an analysis would report with the score the same model gets on fresh data.

A few results from the default settings:
• Picking the "top 10" of 1,000 random features before cross-validation: reported AUC 0.89, real 0.50.
• Splitting patient visits at random instead of by patient: reported 0.91, new patients 0.73.
• Oversampling rare cases before splitting: reported 0.99, new data 0.84.

Some leaks are small. Fitting a scaler on all rows barely moves the score in these simulations, and the site says so.

Every scenario includes the wrong and the right scikit-learn code, a chart of the gap, a shareable link and an embed for course pages. All data is synthetic and generated in your browser. There is no tracking.

It's built for teaching: courses, journal clubs, code review checklists. There is also a one-page printable checklist.

https://YOUR-GITHUB-USERNAME.github.io/data-leakage-playground/

#MachineLearning #DataScience #Reproducibility #HealthData

---

## X thread (5 posts)

**1/5**
I built Data Leakage Playground: eight interactive demos of how ML validation scores get inflated, with a Leaky/Correct switch and the score on fresh data next to the reported one.
Free, open source, runs in your browser.
https://YOUR-GITHUB-USERNAME.github.io/data-leakage-playground/

**2/5**
Clearest case: 80 rows, 1,000 pure-noise features, coin-flip labels.
Pick the top 10 features using all rows, then cross-validate → AUC 0.89.
Pick inside each training fold → 0.51.
New data → 0.50.

**3/5**
Patients with 4 visits each, k-NN, random split by visit → AUC 0.91.
GroupKFold by patient → 0.76.
Brand-new patients → 0.73.
The model was recognising people, not the disease.

**4/5**
Not every leak is large. Fitting the imputer and scaler on all rows changes AUC by less than 0.01 here, and the page says that. Tuning 20 settings on a 60-row test set adds about 0.06.
The test suite checks each effect, so the numbers can't drift into drama.

**5/5**
Each scenario has wrong and right scikit-learn code that runs as is, a gap chart, share links and an iframe embed.
Based on the Princeton leakage taxonomy and REFORMS checklist.
Code (MIT): https://github.com/YOUR-GITHUB-USERNAME/data-leakage-playground

---

## Suggested GitHub topics

`machine-learning`, `data-leakage`, `scikit-learn`, `education`, `interactive`, `reproducibility`, `cross-validation`, `data-science`, `react`, `typescript`, `vite`, `github-pages`

## Repository description

Interactive, in-browser demos of eight kinds of ML data leakage, with wrong/right scikit-learn code.

## Social preview image

`docs/social-preview.png` (1280 × 640). Upload it under **Settings → General → Social preview**. The source is `docs/social-preview.svg`; regenerate the PNG with `npm run social`.
