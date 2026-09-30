# CodeForge Assignment Submission

## Application

[Open the public grading console](https://codeforge-grading-console.kumarsuryansh25.chatgpt.site)

The completed console supports Excel import, course selection, marks analytics, editable grade bands, validation and CSV export. The submission includes 18 documented issue fixes, seven enhancements, the source code, a fictional sample workbook and dated testing evidence. The final design offers Ocean, Sunset and Berry colour schemes with friendlier prompts and a responsive layout.

Select **Try the sample class** to try the complete workflow, then enter an instructor name. The demo contains 60 fictional records across Data Structures and Linear Algebra.

## Assignment completion

- Stage 1 Debug: issue reproduction, causes, fixes and verification are recorded in the six-column log below.
- Stage 2 Reimagine: seven enhancements improve import feedback, course drafts, student review, export review, analytics, responsive operation and the colour schemes.
- Stage 3 Deploy: the static app is published at the URL above. The complete source is prepared for the user's GitHub upload. Add the repository's actual URL to the submission form after uploading.

## Verification

On 27 September, 20 domain tests and 19 browser checks passed. The original-source probes reproduced 12 defects; six additional issues were identified from source inspection. On 30 September, all 20 domain tests passed again, and the new colour schemes, saved theme preference, preserved cutoffs and mobile export review were checked through the browser UI. The test report below distinguishes the two verification rounds.

## Scope and operating rules

This is a CodeForge challenge prototype, not an official BITS grading tool. Import whole-number marks from 0 through 100 and exclude NC students. The first worksheet is used, with a limit of 5 MB and 50,000 student rows. Student data and grade drafts stay in the current browser tab and are cleared on refresh; only the colour preference is saved. Import BITS IDs as text in Excel when leading zeros matter.

The app follows the assignment's whole-number rule. Fractional marks must be handled using the institution's rounding policy before import.


# Stage 1 Bug Fix Log

This log follows the six-column structure in the assignment. The original source is preserved in `reference/original.html`. Browser probes in `tests/original-defects.mjs` reproduce 12 defects; the remaining entries were identified by source inspection and verified against the replacement implementation. Evidence is in `docs/original-defects.json` and `docs/browser-results.json`.

| # | Bug / Issue Identified | How You Reproduced It | Root Cause | Fix Implemented | How You Tested the Fix |
|---|---|---|---|---|---|
| 1 | File picker requests `.xls` even though the assignment requires `.xlsx`. | Inspected the picker’s `accept` attribute; it is `.xls`. | The accepted extension contradicts the required input format. | Accept `.xlsx`, check its extension and ZIP signature, and provide a matching blank template. | Browser check verifies the attribute, downloads the template and imports an actual `.xlsx` file. |
| 2 | Duplicate courses within one upload and after later uploads. | Uploaded two CS rows: options became placeholder, CS, CS. Uploaded Math: the old CS options remained. | The upload handler appends an option for every row without clearing or deduplicating. | Build a sorted unique course list when a validated dataset is committed. | Replaced a demo workbook with a two-course workbook and verified exactly two correct options. |
| 3 | A second upload leaves a stale selected course and invalid analytics. | Selected CS, then uploaded only Math. CS remained selected; average and median became NaN. | Data changes without reconciling the selected course, drafts or summaries; empty statistics are unguarded. | Replace related state together, select a valid course, and return null statistics for empty data. | Original browser probe captured NaN. New import and empty-statistics tests pass. Invalid imports preserve the previous workbook. |
| 4 | Minimum and maximum values appear under the wrong labels. | Loaded marks 20 and 90. Original UI displayed Min 90 and Max 20. | The `min` and `max` element IDs are swapped in the markup. | Bind a clearly labeled lowest / highest statistic to the actual minimum and maximum. | Browser import of marks 0 and 100 displays `0 / 100`; unit tests cover constant and mixed scores. |
| 5 | Numeric strings produce wrong means and medians. | Passed string marks “80” and “70” through the original statistics function. Mean was 3540.00 and median was 3540. | JavaScript concatenates strings during summation and even-length median calculation. | Normalize valid numeric strings into numbers before records enter the application. | Unit tests confirm mean 75 for string marks 80 and 70, plus odd/even median cases. |
| 6 | Invalid marks, missing identifiers and duplicate records enter grading. | Inspected the upload path: sheet data is assigned directly without schema or row validation. Reproduction inputs include NC, 80.2, 101, missing IDs and repeated student/course pairs. | No checks for headers, required fields, type, bounds, integer marks or duplicate students. | Validate the entire workbook and report worksheet row numbers; reject the import atomically. Accept harmless header aliases from the brief. | Unit tests cover malformed headers, missing fields, duplicate IDs, blanks and invalid marks. Browser tests verify row 2 and row 3 errors while retaining the existing dataset. |
| 7 | Ranges can omit marks at 0 or 100 while validation succeeds. | Set A maximum to 99. Original `validateRanges()` returns an empty error string. A student with 100 would have no matching grade and be skipped in export. | Only internal adjacency is validated; outer endpoints are not checked. | Store seven descending minimum cutoffs. Derive all maxima with A ending at 100 and E starting at 0. Block invalid configurations. | Exhaustively checked all 101 integer marks for exactly one band; verified 0 and 100 survive import and grading. |
| 8 | Valid single-mark grade bands are rejected. | Set A to 100–100 and cascade the next maximum. Original validation says Min must be less than Max. | `min >= max` rejects inclusive bands containing one integer. | Descending cutoffs allow one-mark bands such as A 100–100. | Tested seven tight cutoffs and confirmed every mark 0–100 remains assigned exactly once. |
| 9 | Reset crashes before selecting a course and asks twice when usable. | Clicked Reset on initial load and accepted both dialogs. Browser raised “Cannot set properties of null”. | Grade controls do not exist until course selection; reset dereferences them without a guard and contains two confirmations. | Disable reset until a draft exists, use one confirmation, and provide undo. | Browser tests cover disabled initial reset, a successful confirmed reset and undo back to edited boundaries. |
| 10 | Removing the instructor name still permits export. | Entered a name, selected CS, then cleared the name. Original export remained enabled. | Name validation runs only in the course-change handler. | Recompute export readiness when the name changes and validate again inside CSV generation. | Browser test clears the name and verifies export is disabled; unit test rejects whitespace-only names. |
| 11 | Course changes erase customized grading boundaries. | Changed A minimum to 85 and triggered the original course-change handler. It returned to 80. | Every course change rebuilds the controls from global defaults. | Keep independent drafts and undo history in a map keyed by course. | Edited Data Structures to 79, switched to Linear Algebra, then returned and verified 79 was retained. |
| 12 | Bell curve contains invalid coordinates for constant marks. | Called the original curve renderer with [70, 70]. All 101 plotted y values were non-finite. | The formula divides by a standard deviation of zero. | Show actual histogram counts and standard deviation; explicitly describe constant-score cohorts. Remove the unrequested normal-distribution assumption. | Unit test verifies zero standard deviation. Browser test imports 1,000 identical marks and confirms a valid chart and explanatory text. |
| 13 | Histogram clips large cohorts and ambiguously labels bin boundaries. | Source uses bar height `count × 12` in a fixed canvas, so 20 students require 240 px above a 210 px baseline. Labels overlap at 10, 20, etc. | Fixed pixel scaling and labels do not match the binning function. | Scale the y-axis to the highest count; label bins 0–9 through 90–100 and provide a text equivalent. | Browser test confirms the 1,000-student bar stays within the chart. Unit test verifies bin counts for every mark 0–100. |
| 14 | CSV fields are not escaped and spreadsheet formulas can be interpreted. | Inspected string interpolation with an instructor such as `Dr. A, B` or an ID starting with `=`. Commas split columns and formula-like values are unchanged. | CSV rows are concatenated without escaping or handling untrusted spreadsheet text. | Quote every field, double embedded quotes, use CRLF and UTF-8 BOM, and prefix formula-like text with an apostrophe. Revoke temporary download URLs. | Unit tests cover commas, quotes, line breaks and formula prefixes. Browser downloads verify all course rows are included even under an active search filter. |
| 15 | Review timer and repeat exports disagree. | Source starts timing at page load and stops the interval on first export; later exports calculate a new elapsed duration despite the frozen display. | One page-global timer mixes loading time, courses and finalized attempts. | Track review time per course; pause on switching/finalizing and resume when a finalized draft is revised. | Browser test exports, edits a cutoff and verifies the displayed timer advances again. Initial empty state is 00:00. |
| 16 | Mobile layout overflows horizontally. | Opened the original at 390 px: document width was 668 px. It also lacks a viewport meta tag. | Fixed 420 px analytics column and desktop control grid have no responsive layout. | Add viewport metadata, responsive grids, stacked mobile controls, labeled inputs, keyboard focus and accessible dialogs. | Browser checks pass at 390 px and with 200% root text enlargement; desktop and mobile screenshots reviewed. |
| 17 | Unreadable files and canceled input lack recovery. | Source inspection shows unchecked `files[0]`, unguarded workbook parsing and no reader error path. | Upload assumes a selected, valid workbook. | Guard empty selection; parse in a worker with errors, a 15-second timeout, size/row limits and formula-cell rejection. | Browser tests import a corrupt workbook and a formula workbook; both show useful errors without replacing data. Replacement cancellation preserves current data. |
| 18 | Rounding guidance contradicts itself. | Original guidance says “nearest integer” but gives 80.2 → 81; the brief requires whole numbers. | The example describes ceiling behavior while the text describes rounding to nearest. | Require whole-number marks and tell instructors to apply their institution’s policy before importing. Do not silently round. | Unit tests reject 80.2 and browser checks show an actionable row-specific message. |

# Stage 2 Enhancement Summary

The redesign keeps the original workflow: upload marks, select a course, inspect analytics, configure grades, validate and export. It adds seven improvements aimed at the instructor’s work. The top three for the submission form are summarised in `SUBMISSION_ANSWERS.md`.

## 1 Import checks with precise feedback

A workbook is validated before it replaces the current dataset. Errors identify the worksheet row and field, so the instructor can correct the source. Checks cover the three-column schema, missing fields, duplicate students within a course and whole-number marks from 0 to 100. Invalid files leave the current data intact. A blank Excel template and clearly labeled fictional sample data make the expected format easy to learn.

## 2 Course drafts with undo and visible impact

Each course retains its own cutoffs during the session. Instructors edit seven minimums; maximums adjust automatically to preserve full coverage. Undo and a single reset confirmation make experimentation reversible. The student review shows which grades differ from the default scheme and how many students are affected.

## 3 Student-level review

A searchable, sortable, paginated student table exposes the result for each BITS ID. Instructors can filter by grade to examine a group. The export always includes every student in the course, independent of table filters, preventing accidental partial submissions.

## 4 Review before export and a separate audit record

The final dialog shows course, instructor, student count, complete grade coverage and the chosen grade bands. The CSV has a regular five-column schema with proper escaping. A companion JSON audit contains the grade policy, distribution, statistics, source filename and timestamp. Course-specific filenames help distinguish downloads.

## 5 Analytics that remain readable across cohort sizes

A responsive histogram uses count-based scaling, correct inclusive bin labels and a text alternative. Grade counts and percentages accompany the colored distribution bar. Minimum, maximum, mean, median and standard deviation come from validated numeric marks. Constant-score cohorts have explicit feedback.

## 6 Browser-local and responsive operation

Student data stays in browser memory; there is no upload endpoint or persistent storage of marks. A worker keeps workbook parsing separate from the interface. The app supports narrow screens, keyboard controls, visible focus, live status/error messages and native dialogs. It does not depend on an external CDN at runtime.

## 7 A warmer interface with three colour schemes

Ocean combines teal, blue and gold; Sunset uses coral, warm orange and plum; Berry brings together purple, pink and teal. The selected palette carries through the navigation, statistics cards, histogram and grade bands. Grade labels and counts remain visible alongside colour. Buttons have accessible names and selected states. Only the colour preference is remembered after refresh; marks and grade drafts remain temporary.

The wording is more conversational, with prompts such as “Try the sample class” and “Take one last look, then download your results.” Softer panel backgrounds and clearer headings make the page easier to scan without hiding the information needed for grading.

# Test Report and Reproduction

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
