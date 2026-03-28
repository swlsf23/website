# Infrastructure (lowest cost, no Docker)

Terraform provisions **S3 + CloudFront** for the built SPA (static HTML/JS/CSS only). No API or database in this stack.

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
