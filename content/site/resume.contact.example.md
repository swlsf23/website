# Résumé contact line

Edit **`content/site/contact.md`** (committed). Its body is merged into the site and PDF wherever **`<!-- resume-contact -->`** appears in `resume.md` or `writing-samples.md`.

Optional: set **`RESUME_PHONE`** / **`RESUME_EMAIL`** when running PDF generation to override the file (see **`scripts/render_resume_pdf.mjs`**).

Legacy gitignored file **`resume.contact.local.md`** is no longer used by the generator; use **`contact.md`** instead.
