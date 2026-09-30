# Enhancement Summary

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
