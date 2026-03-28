# Infrastructure (lowest cost, no Docker)

Terraform provisions **S3 + CloudFront** for the built SPA (static HTML/JS/CSS only). No API or database in this stack.

## Prerequisites

- [Terraform](https://www.terraform.io/) `>= 1.5`
- AWS credentials — prefer **`aws configure sso`**; full prompt walkthrough: [`../content/docs/aws-sso-local.example.md`](../content/docs/aws-sso-local.example.md)

**Before `terraform apply` / `destroy`**, use the same terminal session and sign in with SSO (profile name may match what you chose at `aws configure sso`; default permission-set profile often looks like `AdministratorAccess-<account-id>`):

```bash
export AWS_PROFILE=… && aws sso login
```

(Equivalent: set `AWS_PROFILE`, then run `aws sso login` on the next line—see example profile name in [`../content/docs/aws-sso-local.example.md`](../content/docs/aws-sso-local.example.md).)

## Apply

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — spa_bucket_name must be globally unique
terraform init
terraform plan
terraform apply
```

Note the outputs: `cloudfront_url`, `custom_site_urls` (if you set `custom_domain_aliases`), `cloudfront_distribution_id`, `spa_bucket_name`.

If **`terraform apply`** fails with **`BucketAlreadyExists`**, the name is already taken in AWS (often a leftover bucket). Either delete it: `aws s3 rb s3://<name> --force --region us-east-1`, or adopt it: **`./manage-site.sh infra-import-bucket`** then **`terraform apply`**.

## Destroy

From the **repository root** (same as `cd infra/terraform && terraform destroy`):

```bash
./manage-site.sh infra-destroy
```

The bucket uses **`force_destroy = true`** and **`versioning` suspended** so Terraform can delete objects and the bucket during destroy.

### Custom domain (e.g. sleslie23.com)

In `terraform.tfvars`, set `custom_domain_aliases` and `route53_zone_ids` (apex domain → hosted zone ID). Terraform requests an ACM certificate in **`us-east-1`**, creates DNS validation records, updates CloudFront, then adds Route 53 alias **A**/**AAAA** records. **Run `terraform plan` and `terraform apply` from your terminal** (with `AWS_PROFILE` / `aws sso login` as usual). CloudFront updates can take several minutes.

## Deploy the SPA bundle

From the **repository root**, with **`export AWS_PROFILE=…`** and **`aws sso login`** as in Prerequisites:

```bash
./manage-site.sh site-build    # npm ci, PDFs, vite build → apps/web/dist
./manage-site.sh site-deploy   # aws s3 sync + CloudFront invalidation (uses terraform output if env vars unset)
```

## CI/CD (GitHub Actions)

Pushes to **`main`** run [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml): build the SPA (including PDF generation) then **`aws s3 sync`** and **CloudFront invalidation**, using **OIDC** (no long-lived AWS keys in GitHub).

### 1. Terraform: deploy role (optional but recommended)

In `terraform.tfvars`, set:

- `github_actions_repository` — your repo as `owner/name` (must match GitHub exactly).
- `github_actions_branch` — optional; default is `main`.

Run `terraform init -upgrade` (adds the `tls` provider), then `terraform apply`. Note output **`github_actions_deploy_role_arn`**.

If apply fails because an IAM OIDC provider for `token.actions.githubusercontent.com` already exists in the account, import it once (see the comment at the top of [`terraform/github_ci.tf`](terraform/github_ci.tf)), then apply again.

### 2. GitHub repository settings

**Settings → Secrets and variables → Actions**

- **Secret** `AWS_ROLE_ARN` — value from Terraform output `github_actions_deploy_role_arn`.
- **Variable** `SPA_S3_BUCKET` — from output `spa_bucket_name`.
- **Variable** `CLOUDFRONT_DISTRIBUTION_ID` — from output `cloudfront_distribution_id`.
- **Variable** `AWS_REGION` — optional; the workflow defaults to `us-east-1` if unset.

Commit [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) on **`main`** so Actions can run. You can also trigger a run manually (**Actions → Deploy site → Run workflow**).
