# Upload the final code to GitHub

1. Extract `CodeForge_Submission.zip` on your computer.
2. On GitHub, create a new repository. A suitable name is `codeforge-grading-console`. Choose **Public** so the evaluation team can access it.
3. Open the new repository's **uploading an existing file** link, or choose **Add file → Upload files**.
4. Drag the contents of the extracted `CodeForge_GitHub` folder into the upload area. Keep the `dist`, `docs`, `tests` and `reference` folders intact. `README.md` should be at the repository root. Upload the extracted files, rather than only the ZIP.
5. Commit the uploaded files with a message such as `Add final CodeForge assignment`.
6. Copy the repository URL from your browser into the GitHub field of the assignment form and into `SUBMISSION_ANSWERS.md`.

The public app is already hosted at:

https://codeforge-grading-console.kumarsuryansh25.chatgpt.site

Uploading to GitHub does not require changing that live URL or setting up GitHub Pages. The `dist/` folder contains the deployable website if you later choose another static host.

## What is included

- `dist/`: complete app, three themes, spreadsheet parser and fictional sample workbook.
- `README.md`, `package.json`, `server.mjs`: project overview, local commands and local web server.
- `SUBMISSION_ANSWERS.md`: public URL, top three enhancements and a reflection draft.
- `docs/`: 18-item bug-fix log, full enhancement summary and dated test evidence.
- `tests/`: domain tests and reproducible browser checks.
- `reference/`: the original challenge HTML for comparison.

The package excludes Git history, local credentials, hosting configuration and temporary test files. The vendored spreadsheet parser's license is included in `dist/vendor/LICENSE`.

For the current upload controls, see [GitHub's file upload guide](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).
