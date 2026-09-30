# CodeForge Grading Console

A completed implementation of the BITS Digital CodeForge assignment: debugging, at least three meaningful enhancements, testing and web deployment. This is a challenge prototype, not an official BITS Pilani Digital grading tool.

## Live app

[Open the public grading console](https://codeforge-grading-console.kumarsuryansh25.chatgpt.site)

The live app opens in a browser with no installation, account or configuration. Click **Try the sample class** to explore it with fictional data.

## What changed

- Three complete colour schemes: **Ocean**, **Sunset** and **Berry**, with matching charts, grade labels and summary cards.
- Excel validation, separate grade drafts for each course, undo and a count of students affected by changes.
- A searchable student table and a final review before downloading all course grades and an optional audit record.

## Run locally

Requires Node.js 20 or later. No package installation or build is needed to run the app.

```sh
node server.mjs
```

Open http://127.0.0.1:4173. Use an HTTP server; opening `index.html` directly may block ES modules and the workbook worker.

## Input contract

- `.xlsx`, at most 5 MB and 50,000 student rows.
- First worksheet only, starting at A1. Multiple sheets are explicitly reported.
- Exactly three columns: BITS ID, Course, Total Marks. Their order can vary. Whitespace/case variations and the longer header labels used in the assignment brief are accepted.
- IDs should be stored as text to retain leading zeros. Already-lost digits in numeric Excel cells cannot be recovered.
- Course must be nonempty text. IDs are compared case-insensitively for duplicate detection within an exact, trimmed course name.
- Marks must be whole numbers from 0 through 100. Numeric strings such as “80” are accepted; decimals such as 80.2, NC, blanks and formula cells are rejected.
- Entirely blank rows are ignored. Students who should receive NC must be excluded.
- An invalid workbook never replaces the currently loaded data.

## Grade policy

Defaults: A 80–100, A- 70–79, B 60–69, B- 50–59, C 40–49, C- 30–39, D 20–29, E 0–19.

Seven descending integer minimum cutoffs determine all eight inclusive grade bands. A always ends at 100 and E always starts at 0. Single-mark bands are valid. Invalid cutoffs block export and show pending grades until corrected. There is no automatic curve fitting or automatic rounding.

## Export contract

CSV columns are BITS ID, Course, Total Marks, Grade, Instructor. Every student in the selected course is exported. Fields are quoted and escaped; potentially executable spreadsheet text is prefixed with an apostrophe. The file uses UTF-8 BOM and CRLF for spreadsheet compatibility. Import the BITS ID column as text in Excel when leading zeros matter; quoting CSV values alone does not override Excel’s type inference.

The optional JSON audit records the course, instructor, workbook name, sample-data flag, timestamp, grade bands, counts, statistics, review seconds and changed-from-default count. It does not contain the student roster.

## Project map

- `dist/index.html` — accessible page structure and dialogs.
- `dist/styles.css` — responsive interface and print-independent browser layout.
- `dist/themes.css` — the Ocean, Sunset and Berry colour schemes.
- `dist/app.mjs` — session state, course drafts, rendering, review and downloads.
- `dist/core.mjs` — pure validation, grading, statistics and CSV functions.
- `dist/workbook-worker.js` — workbook parsing with a worker timeout.
- `dist/vendor/` — pinned SheetJS 0.20.3 parser and Apache 2.0 license.
- `reference/original.html` — supplied challenge source, unchanged.
- `tests/` — domain tests, browser regression checks and original defect probes.
- `docs/` — required bug log, enhancement summary, testing evidence and deployment details.

## Tests

```sh
node --test tests/core.test.mjs
```

For optional browser checks, run the local server, make Playwright available, then run:

```sh
node tests/browser.mjs
node tests/original-defects.mjs
```

The scripts accept `CODEFORGE_PLAYWRIGHT_PATH` for an absolute Playwright module path, `CODEFORGE_CHROME_PATH` for an installed Chrome executable, and `CODEFORGE_QA_DIR` for output evidence. They use an isolated headless browser. Browser tests write the fictional sample workbook and QA screenshots. They do not use a personal browser profile.
