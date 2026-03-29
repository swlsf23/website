# Website frontend (Vite + React + TypeScript)

## Site copy (Markdown, build-time)

Page content lives in **`content/site/*.md`** at the repo root. **`npm run dev`** and **`npm run build`** run **`generate:content` first**, which writes `src/generated/sitePages.ts` from that Markdown. There is **no runtime API**—everything is bundled into the static app.

**Resume contact:** Edit **`content/site/contact.md`**. The placeholder `<!-- resume-contact -->` in **`content/site/resume.md`** is replaced at generate time with the body of `contact.md`. The same file is used for PDF export in **`scripts/render_resume_pdf.mjs`**. `contact.md` is not listed as its own page (it is skipped in the generator so there is no `/contact` route unless you add it later).

**Skipped** from `sitePages`: `writing-samples.md`, `contact.md`, contact examples/locals; see **`scripts/generate-site-content.mjs`**.

## Vite template notes

This template provides a minimal setup for React with Vite, HMR, and ESLint.
