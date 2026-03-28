# Website frontend (Vite + React + TypeScript)

## Site copy (Markdown, build-time)

Page content lives in **`content/site/*.md`** at the repo root. **`npm run dev`** and **`npm run build`** run **`generate:content` first**, which writes `src/generated/sitePages.ts` from that Markdown. There is **no runtime API**—everything is bundled into the static app.

Résumé PDF sources (`resume.md`, `writing-samples.md`, contact files) are **not** included in `sitePages`; they are only used by the PDF scripts under `scripts/`.

## Vite template notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
