# Private contact (not committed)

Create `content/resume.contact.local.md` (same directory as this file). That filename is gitignored—do not commit it.

Put Markdown in that file only (no `#` headings unless you want them in the PDF). Example one-liner:

    (555) 555-5555 · you@example.com

Or with links:

    [(555) 555-5555](tel:+15555551234) · [you@example.com](mailto:you@example.com)

Alternatively, set environment variables when building; if `RESUME_PHONE` or `RESUME_EMAIL` is set, those are used instead of the local file:

    export RESUME_PHONE="(555) 555-5555"
    export RESUME_EMAIL="you@example.com"
    cd apps/web && npm run resume:pdf
