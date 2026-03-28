# Website

Monorepo: **Vite + React** (`apps/web`), page copy in **`content/personal/`** (Markdown). At **dev and build** time, `scripts/generate-site-content.mjs` turns that Markdown into bundled TypeScript (`apps/web/src/generated/sitePages.ts`)—**no database, no API at runtime.**

---

## Prerequisites

### Local development

- **Node.js** (LTS) and npm — for `apps/web`

### Deploying the static site to AWS (S3 + CloudFront)

- **AWS CLI** — install the [official AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), then **`aws configure sso`** (see **[`content/docs/aws-sso-local.example.md`](content/docs/aws-sso-local.example.md)** for every prompt)
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

From the **repository root** (or use **`./manage-site.sh site-build`**, which does this plus `npm run build`):

```bash
cd apps/web && npm ci && npx playwright install chromium && npm run resume:pdf:all
```

---

## Build and install (production)

### SPA bundle (static files)

From the **repository root**, [`./manage-site.sh`](./manage-site.sh) wraps the usual steps:

1. **`./manage-site.sh infra-create`** — `terraform init` (if needed) + `terraform apply` in `infra/terraform` (copy `terraform.tfvars.example` → `terraform.tfvars` and set `spa_bucket_name` first).

2. **`export AWS_PROFILE=… && aws sso login`** before Terraform / deploy (see [`content/docs/aws-sso-local.example.md`](content/docs/aws-sso-local.example.md)).

3. **`./manage-site.sh site-build`** — `npm ci`, Playwright PDFs, `npm run build` → `apps/web/dist`.

4. **`./manage-site.sh site-deploy`** — `aws s3 sync` of `dist/` to the bucket and CloudFront invalidation (needs **AWS CLI**). Reads `SPA_S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `AWS_REGION` if set; otherwise **`terraform output`** from `infra/terraform`.

5. **`./manage-site.sh infra-destroy`** — confirm with `yes`, then `terraform destroy`.

Run **`./manage-site.sh help`** for the command list.

More detail: [`infra/README.md`](infra/README.md). **Auth / SSO:** [`content/docs/aws-auth-and-deploy.md`](content/docs/aws-auth-and-deploy.md).

---

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/web/` | React SPA (static after build) |
| `content/personal/` | Authoring Markdown: site pages (`home.md`), résumé (`resume.md`, etc.) |
| `content/docs/` | Project docs: [`aws-auth-and-deploy.md`](content/docs/aws-auth-and-deploy.md), [`aws-sso-local.example.md`](content/docs/aws-sso-local.example.md) (copy to `aws-sso.local`) |
| `scripts/generate-site-content.mjs` | Build-time: `content/personal` → `apps/web/src/generated/sitePages.ts` |
| `manage-site.sh` | Repo root: Terraform + `site-build` + `site-deploy` (wrapper only) |
| `scripts/` | `render_resume_pdf.mjs`, `resume-print.css`, `generate-site-content.mjs`, … |
| `infra/terraform/` | S3 + CloudFront for the built SPA |

---

## License

Add a license file if you open-source this repo.
