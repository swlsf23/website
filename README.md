# Website

Monorepo: **Vite + React** (`apps/web`), **FastAPI** (`apps/api`), page copy in **`content/`**, seed script in **`scripts/`**. Postgres holds site content at runtime.

---

## Prerequisites

### Everyone (local development)

- **Node.js** (LTS) and npm — for `apps/web`
- **Python 3.12+** — for `apps/api` and `scripts/`
- **PostgreSQL** — running locally (e.g. Homebrew or Postgres.app on macOS); no Docker required

### Deploying the static site to AWS (S3 + CloudFront)

- **AWS CLI** — required; install the [official AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), then run `aws configure` and verify with `aws sts get-caller-identity`
- **Terraform** (1.5+) — for `infra/terraform` (S3 bucket + CloudFront)
- **AWS account + IAM credentials** with permission to create S3, CloudFront, and related resources

### Deploying the API + database on EC2

- No Docker; use the outline in [`infra/README.md`](infra/README.md) (Postgres + systemd + venv on one instance).

---

## Local development

### 1. API (FastAPI)

From the repo root:

```bash
./scripts/bootstrap_api_venv.sh
```

Copy `apps/api/.env.example` to `apps/api/.env` and set `DATABASE_URL` for your local Postgres.

```bash
cd apps/api
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m alembic upgrade head
cd ../..
python scripts/seed_db.py
cd apps/api
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Details: [`apps/api/README.md`](apps/api/README.md)

### 2. Web (Vite)

In another terminal:

```bash
cd apps/web
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server proxies `/api` to port 8000.

Details: [`apps/web/README.md`](apps/web/README.md)

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

3. **Production API URL** — Create `apps/web/.env.production` (or export in the shell) with your public API origin:

   ```bash
   # Example — no trailing slash
   export VITE_API_URL=https://api.example.com
   ```

4. **Build and upload** — From the **repository root**:

   ```bash
   export SPA_S3_BUCKET="<spa_bucket_name from terraform output>"
   export CLOUDFRONT_DISTRIBUTION_ID="<cloudfront_distribution_id>"
   export AWS_REGION=us-east-1
   python scripts/deploy_site.py
   ```

   This runs `npm ci` and `npm run build` in `apps/web`, uploads `dist/` to S3, and invalidates CloudFront.

5. **CORS** — On the API host, set `CORS_ORIGINS` in `apps/api/.env` to include your CloudFront origin (see `cloudfront_url` from Terraform), e.g. `https://d1234567890abc.cloudfront.net`.

Full infra and EC2 notes: [`infra/README.md`](infra/README.md)

---

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/web/` | React SPA |
| `apps/api/` | FastAPI + Alembic |
| `content/` | Authoring Markdown for pages (seeded into Postgres) |
| `scripts/` | `seed_db.py`, `deploy_site.py`, `bootstrap_api_venv.sh` |
| `infra/terraform/` | S3 + CloudFront for the built SPA |

---

## License

Add a license file if you open-source this repo.
