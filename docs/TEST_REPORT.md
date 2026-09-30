# Test Report

## Original functional validation — 27 September 2026

- 20 domain tests passed using Node’s built-in test runner.
- 19 browser checks passed in an isolated headless Chromium session, including the final check for zero uncaught page exceptions.
- 12 original-defect probes produced the expected failing behavior in the supplied console.
- Desktop, mobile and export-dialog screenshots were inspected.

## Colour update verification — 30 September 2026

- All 20 domain tests passed again after the theme changes.
- Ocean, Sunset and Berry were selected in the local browser preview; the selected button and page theme updated correctly.
- Changing the A cutoff to 79 and switching themes preserved 48 Data Structures students, the edited cutoff and the one-student impact count.
- Refreshing preserved the chosen Berry theme and cleared the temporary grading session as intended.
- At a 390 px viewport, the document width stayed at 390 px. The export dialog's right edge was at 374 px, inside the viewport.
- The final review showed Data Structures, the entered instructor name, 48 students and all eight grade bands after switching to Ocean.
- No browser console errors were returned during these checks.

The 19-check automated browser suite above belongs to the original functional validation. The theme update was checked separately through the browser UI; that full suite was not rerun for this visual revision.

## Coverage

Domain tests cover all 101 possible integer marks, every default cutoff boundary, singleton grade bands, invalid cutoffs, empty statistics, odd and even medians, constant cohorts, numeric-string conversion, schema aliases, invalid marks, missing fields, blank rows, duplicate IDs, histogram counts, CSV escaping, formula-like text, instructor validation and record conservation for 50,000 rows.

Browser checks cover the empty state, correct `.xlsx` picker, downloaded template contents, sample data, independent course drafts, undo/reset, grade impact, filtering, sorting, pagination, full-course CSV export under active filters, JSON audit, timer resumption, actual workbook replacement, row-level errors, formula workbooks, corrupt files, cancellation, a 1,000-student constant cohort and clearing an instructor name.

Layout checks verify no page-wide horizontal overflow at 390 px or with 200% root text enlargement at a 1280 px viewport. The student table supports local horizontal scrolling on narrow screens.

## Reproduction

Run `node --test tests/core.test.mjs`. Start `node server.mjs` and run the browser scripts as described in the README. Exact original failures and the browser check list are included as JSON alongside this report.

The original probes use the same local parser build to keep their results independent of CDN availability. The supplied source itself is unchanged. Deployment success is verified separately through the hosting service’s terminal deployment status.

## Scope

These checks validate the assignment’s workflow and regression cases. They do not constitute a formal accessibility audit, a load test of the hosting provider, or testing on physical mobile devices. No real student marks were used.
