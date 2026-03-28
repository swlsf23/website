# Website

Monorepo: **Vite + React** (`apps/web`), page copy in **`content/personal/`** (Markdown). At **dev and build** time, `scripts/generate-site-content.mjs` turns that Markdown into bundled TypeScript (`apps/web/src/generated/sitePages.ts`)—**no database, no API at runtime.**

---

## Prerequisites

### Local development

- **Node.js** (LTS) and npm — for `apps/web`
- **Python 3** — optional; only for `scripts/deploy_site.py` (AWS upload) if you use it

### Deploying the static site to AWS (S3 + CloudFront)

- **AWS CLI** — install the [official AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), then `aws configure`
- **Terraform** (1.5+) — for `infra/terraform` (S3 bucket + CloudFront)
- **AWS account + IAM credentials** with permission to create S3, CloudFront, and related resources

---

## Local development

### 1. Web (Vite)

```bash
cd apps/web
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server runs **`predev`**, which regenerates `sitePages.ts` from `content/personal/*.md` (site pages only; résumé sources are excluded).

Details: [`apps/web/README.md`](apps/web/README.md)

### 2. Résumé PDF (manual, scriptable)

[`content/personal/resume.md`](content/personal/resume.md) → [`apps/web/public/resume.pdf`](apps/web/public/resume.pdf); [`content/personal/writing-samples.md`](content/personal/writing-samples.md) → [`apps/web/public/writing-samples.pdf`](apps/web/public/writing-samples.pdf). **Markdown → HTML → print CSS → headless Chromium** (Playwright). Styling: [`scripts/resume-print.css`](scripts/resume-print.css).

From the **repository root**:

```bash
./generate-resume-pdf.sh
```

Equivalent: `cd apps/web && npm install && npx playwright install chromium && npm run resume:pdf:all`.

---

## Build and install (production)

### SPA bundle (static files)

1. **Infrastructure** — Apply Terraform so you have an S3 bucket and CloudFront distribution:

   ```bash
   cd infra/terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars: set spa_bucket_name (globally unique)
   terraform init
   terraform apply
   ```

   Copy outputs: `spa_bucket_name`, `cloudfront_distribution_id`, `cloudfront_url`.

2. **Install deploy tooling** — Python deps for the upload script:

   ```bash
   pip install -r scripts/requirements-deploy.txt
   ```

3. **Build and upload** — From the **repository root**:

   ```bash
   export SPA_S3_BUCKET="<spa_bucket_name from terraform output>"
   export CLOUDFRONT_DISTRIBUTION_ID="<cloudfront_distribution_id from terraform output>"
   export AWS_REGION=us-east-1
   python scripts/deploy_site.py
   ```

   This runs `npm ci` and `npm run build` in `apps/web` (which runs **`generate:content`** then `vite build`), uploads `dist/` to S3, and invalidates CloudFront.

Notes: [`infra/README.md`](infra/README.md)

---

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/web/` | React SPA (static after build) |
| `content/personal/` | Authoring Markdown: site pages (`home.md`), résumé (`resume.md`, etc.) |
| `content/docs/` | Project documentation (placeholder) |
| `scripts/generate-site-content.mjs` | Build-time: `content/personal` → `apps/web/src/generated/sitePages.ts` |
| `generate-resume-pdf.sh` | Repo root: Playwright PDFs into `apps/web/public/` |
| `scripts/` | `deploy_site.py`, `render_resume_pdf.mjs`, `resume-print.css`, … |
| `infra/terraform/` | S3 + CloudFront for the built SPA |

---

## License

Add a license file if you open-source this repo.
