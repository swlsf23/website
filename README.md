# Steven Leslie — portfolio site

This is my personal site. It has my bio, resume, projects, and contact information, plus links to GitHub and LinkedIn in the header.

## Site infrastructure

As a portfolio project, the site is meant to show my familiarity with the full stack needed for a documentation site based on my experience at MuleSoft / Salesforce.

- **AWS (Terraform).** The site infrastructure on AWS is created and managed with Terraform. An S3 bucket and a CloudFront distribution serve the built static files. The bucket, distribution, and the related wiring are handled by Terraform. See [`infra/README.md`](infra/README.md) for more information.
- **CI/CD.** Deployments use [GitHub Actions](.github/workflows/deploy.yml). On every push to `main` or when the workflow is run manually, the job does the following:

  - Installs dependencies, runs `npm run build:site`
  - Assumes an AWS role through OIDC using the `AWS_ROLE_ARN` secret
  - Runs [`scripts/deploy-dist-to-s3.sh`](scripts/deploy-dist-to-s3.sh).

  The required repository variables and secrets are described in the workflow file.

- **Web app.** The front end is a React and TypeScript single-page application, built with Vite. It uses client-side routing through React Router.
- **Content.** Source content is Markdown under `content/site/`. At build time, this content is compiled into `apps/web/src/generated/sitePages.ts`, which the application imports, so the text ships inside the static bundle.
- **PDF output.** The resume and writing samples are also generated from Markdown. A Playwright-driven pipeline uses headless Chromium and print CSS to produce quality PDF output.

## Site content

The application uses routes for each of the content pages:

- About me: bio and background.
- Resume: web view with a table of contents and section links, plus PDFs built from the same sources as the page)
- Projects: an introduction and one card per project section
- Contact: currently a link to LinkedIn.

The Markdown sources for the public pages are under **`content/site/`**.

## Version history

- **2.0.0** — Locale-prefixed routes for English and French (`/en/…`, `/fr/…`), with French Markdown under `content/locale/fr/`, per-locale UI strings, stable resume section anchors, and a French resume PDF (`resume-fr.pdf`) produced alongside the English PDF in the Playwright pipeline. Dynamic SEO (`document` language, `hreflang`, canonical URLs) is planned for **v2.1.0** (see `.cursor/plans/v2_0_0_localization.plan.md`).

- **1.0.0** — Initial tagged release: single-locale (English) portfolio, Markdown → generated `sitePages`, Terraform on AWS (S3 + CloudFront), GitHub Actions deploy, and Playwright-built resume and writing-samples PDFs.
