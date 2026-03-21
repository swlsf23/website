# Infrastructure (lowest cost, no Docker)

Terraform here provisions **S3 + CloudFront** for the built SPA only. The **API + Postgres** run on **one EC2** (systemd + venv + OS Postgres)—bootstrap that host manually or with a separate script; do not add Docker.

## Prerequisites

- [Terraform](https://www.terraform.io/) `>= 1.5`
- AWS credentials (`aws configure` or env vars)

## Apply

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — spa_bucket_name must be globally unique
terraform init
terraform plan
terraform apply
```

Note the outputs: `cloudfront_url`, `cloudfront_distribution_id`, `spa_bucket_name`.

## Deploy the SPA bundle

From the **repository root** (after `pip install -r scripts/requirements-deploy.txt` in any venv):

```bash
export SPA_S3_BUCKET="<spa_bucket_name from terraform output>"
export CLOUDFRONT_DISTRIBUTION_ID="<cloudfront_distribution_id>"
export AWS_REGION=us-east-1
python scripts/deploy_site.py
```

Add your CloudFront URL (and later your custom domain) to **`CORS_ORIGINS`** in the API `.env` on the EC2.

## API + Postgres on EC2 (outline)

On a small Ubuntu/Debian EC2 in a public subnet:

1. Install Postgres and create DB/user; bind Postgres to `localhost` only.
2. Install Python 3.12+, `git`, Caddy or nginx.
3. Clone repo, `python3 -m venv apps/api/.venv`, `pip install -r apps/api/requirements.txt`.
4. Set `apps/api/.env` with production `DATABASE_URL`, `CORS_ORIGINS`.
5. `alembic upgrade head` and `python scripts/seed_db.py`.
6. Systemd unit for `uvicorn` (or gunicorn) listening on `127.0.0.1:8000`.
7. Reverse proxy TLS → `127.0.0.1:8000`.

Point `VITE_API_URL` at your public API URL when running `npm run build` (or set `apps/web/.env.production`).
