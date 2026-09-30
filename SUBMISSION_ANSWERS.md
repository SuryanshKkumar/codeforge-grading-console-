# CodeForge submission answers

## PUBLIC URL OF YOUR DEPLOYED APP

https://codeforge-grading-console.kumarsuryansh25.chatgpt.site

The application opens directly in a browser. No installation, sign-in or configuration is needed. Choose **Try the sample class** to explore it using fictional student records.

## GITHUB REPOSITORY URL

https://github.com/SuryanshKkumar/codeforge-grading-console-

Use the repository's main page URL. Check that it opens while you are signed out so the evaluation team can view the final code.

## MENTION THE TOP-3 ENHANCEMENTS DONE BY YOU IN THE APP

### 1. A more colourful and approachable dashboard

I added three colour schemes—Ocean, Sunset and Berry—so users can choose the look they prefer. The colours carry through the charts, summary cards and grade labels. I also simplified the wording and adjusted the layout for smaller screens. The chosen theme is remembered when the page is opened again.

### 2. Better control over grade boundaries

Each course keeps its own grade settings during the session. Instructors can change the minimum marks, undo a change and see how many students move away from the default grades. The app checks that every mark from 0 to 100 belongs to exactly one grade, which helps prevent gaps or overlaps.

### 3. Clearer student review and export

I added search, grade filters and sorting so instructors can check individual results. Before downloading, a review screen shows the course, instructor, student count and grade boundaries. The CSV includes the whole course even when the table is filtered, and an optional JSON file records the grading settings for reference.

## WHAT ARE YOUR LEARNINGS FROM THIS ACTIVITY?

This activity taught me flow of data through the whole application, from the Excel file to the chart and finally the exported grades. A page can look correct even when the underlying values are wrong. For example, a mark imported as text can affect calculations, and a missed boundary can leave a student without the expected grade.

I also learned to test the less obvious cases: an empty workbook, duplicate IDs, marks of 0 and 100, invalid grade boundaries and switching between courses. Checking these cases made the app more dependable than testing only the sample data.

The design work showed me that small choices matter. Clear error messages, an undo option and a readable summary can make a grading task easier to follow. Adding colour helped, but the labels and numbers still needed to explain what was happening.

Finally, I learned that deployment and documentation are part of finishing the work. Someone evaluating the project should be able to open the app, try it and understand the code without needing me to explain every step.
