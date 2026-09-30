# Deployment

Application URL: https://codeforge-grading-console.kumarsuryansh25.chatgpt.site

The console is hosted as a public static website using Sites. The deployed assets are the files in `dist/`; there is no backend, database or API key. Visitors can import a workbook and grade entirely in their own browser.

Only the application code, licensed spreadsheet parser and fictional sample workbook are published. The assignment source, bug log and test evidence are included in the submission package but are outside the deployed static directory.

The complete source is prepared for upload to a public GitHub repository. After uploading it, use the actual repository URL in the submission form. The live application URL above is separate from the repository URL. See `UPLOAD_TO_GITHUB.md` for the short upload guide.

For another static host, publish the contents of `dist/` with `index.html` at the root and JavaScript served with a JavaScript MIME type. No build command is required.
