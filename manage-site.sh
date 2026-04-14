#!/usr/bin/env bash
# Wrapper: Terraform + SPA build + S3/CloudFront deploy (commands you'd run by hand).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
TF_DIR="$ROOT/infra/terraform"
WEB_DIR="$ROOT/apps/web"

# site-deploy: load local exports (AWS_PROFILE, SPA_S3_BUCKET, …) if this file exists. Override path with MANAGE_SITE_ENV_FILE.
maybe_source_local_env() {
  local f="${MANAGE_SITE_ENV_FILE:-$HOME/.config/website/env.sh}"
  if [[ -f "$f" ]]; then
    # shellcheck source=/dev/null
    source "$f"
  fi
}

# Set AWS_PROFILE (or DEFAULT_AWS_PROFILE) to your SSO profile from ~/.aws/config — no account id in-repo.
ensure_aws_sso() {
  command -v aws >/dev/null 2>&1 || {
    echo "aws CLI not found (needed for SSO login)." >&2
    exit 1
  }
  if [[ -n "${AWS_PROFILE:-}" ]]; then
    :
  elif [[ -n "${DEFAULT_AWS_PROFILE:-}" ]]; then
    export AWS_PROFILE="$DEFAULT_AWS_PROFILE"
  else
    echo "Set AWS_PROFILE (or DEFAULT_AWS_PROFILE) to your SSO profile. See content/docs/aws-sso-local.example.md." >&2
    exit 1
  fi
  aws sso login
}

usage() {
  cat <<'EOF'
Usage: ./manage-site.sh <command>

  infra-create         terraform init (if needed) + terraform apply
  infra-destroy        type yes to confirm, then terraform destroy
  infra-import-bucket  terraform import aws_s3_bucket.spa (if apply fails with BucketAlreadyExists)
  site-build           npm ci, Playwright PDFs, npm run build:site → apps/web/dist (sanity-check / iterate without deploy)
  site-deploy          runs site-build first, then S3 sync + CloudFront invalidation (AWS CLI)
                       SITE_DEPLOY_SKIP_BUILD=1 to upload existing apps/web/dist only.
                       Sources ~/.config/website/env.sh if present (override: MANAGE_SITE_ENV_FILE).

Deploy needs SPA_S3_BUCKET and CLOUDFRONT_DISTRIBUTION_ID (env or ~/.config/website/env.sh), or terraform output from infra/terraform.

Before Terraform / deploy: runs aws sso login (requires AWS_PROFILE or DEFAULT_AWS_PROFILE).
EOF
}

tf_output_raw() {
  local key="$1"
  (cd "$TF_DIR" && terraform output -raw "$key" 2>/dev/null) || return 1
}

resolve_spa_bucket_name() {
  local out
  out=$(cd "$TF_DIR" && terraform output -raw spa_bucket_name 2>/dev/null | tr -d '\r\n') || true
  if [[ -n "$out" ]]; then
    echo "$out"
    return 0
  fi
  if [[ -f "$TF_DIR/terraform.tfvars" ]]; then
    grep -E '^[[:space:]]*spa_bucket_name[[:space:]]*=' "$TF_DIR/terraform.tfvars" | head -1 | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/' | tr -d '\r\n'
  fi
}

resolve_aws_region() {
  if [[ -n "${AWS_REGION:-}" ]]; then
    echo "${AWS_REGION}"
    return 0
  fi
  if [[ -n "${AWS_DEFAULT_REGION:-}" ]]; then
    echo "${AWS_DEFAULT_REGION}"
    return 0
  fi
  if [[ -f "$TF_DIR/terraform.tfvars" ]]; then
    grep -E '^[[:space:]]*aws_region[[:space:]]*=' "$TF_DIR/terraform.tfvars" | head -1 | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/' | tr -d '\r\n'
  fi
}

resolve_deploy_env() {
  export AWS_REGION="${AWS_REGION:-$(resolve_aws_region)}"
  AWS_REGION="${AWS_REGION:-us-east-1}"
  export AWS_REGION
  export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-$AWS_REGION}"

  if [[ -n "${SPA_S3_BUCKET:-}" && -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]]; then
    export SPA_S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID
    return 0
  fi
  if [[ ! -d "$TF_DIR/.terraform" ]]; then
    echo "Deploy target not configured: SPA_S3_BUCKET and CLOUDFRONT_DISTRIBUTION_ID are unset." >&2
    echo "Set both (e.g. export SPA_S3_BUCKET=your-bucket CLOUDFRONT_DISTRIBUTION_ID=E123...)." >&2
    echo "Tip: put them in ~/.config/website/env.sh — site-deploy sources that file automatically if it exists" >&2
    echo "(override path with MANAGE_SITE_ENV_FILE). Or install Terraform and run terraform init in infra/terraform." >&2
    return 1
  fi
  SPA_S3_BUCKET="${SPA_S3_BUCKET:-$(tf_output_raw spa_bucket_name)}" || {
    echo "Could not read spa_bucket_name from terraform output. Check infra/terraform state and terraform init." >&2
    return 1
  }
  CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-$(tf_output_raw cloudfront_distribution_id)}" || {
    echo "Could not read cloudfront_distribution_id from terraform output. Check infra/terraform state and terraform init." >&2
    return 1
  }
  export SPA_S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID
  echo "Using bucket=$SPA_S3_BUCKET distribution=$CLOUDFRONT_DISTRIBUTION_ID region=$AWS_REGION" >&2
}

cmd_infra_create() {
  ensure_aws_sso
  cd "$TF_DIR"
  if [[ ! -d .terraform ]]; then
    terraform init
  fi
  terraform apply
}

cmd_infra_destroy() {
  ensure_aws_sso
  echo "WARNING: terraform destroy in infra/terraform." >&2
  echo "  Only 'yes' will be accepted to confirm." >&2
  read -r reply
  if [[ "$reply" != "yes" ]]; then
    echo "Aborted." >&2
    exit 1
  fi
  cd "$TF_DIR"
  if [[ ! -d .terraform ]]; then
    terraform init
  fi
  terraform destroy
}

cmd_infra_import_bucket() {
  ensure_aws_sso
  local bucket
  bucket="$(resolve_spa_bucket_name)"
  if [[ -z "${bucket:-}" ]]; then
    echo "Could not read spa_bucket_name from terraform output or infra/terraform/terraform.tfvars." >&2
    exit 1
  fi
  cd "$TF_DIR"
  if [[ ! -d .terraform ]]; then
    terraform init
  fi
  echo "Importing existing bucket into Terraform state: aws_s3_bucket.spa <- ${bucket}" >&2
  terraform import aws_s3_bucket.spa "$bucket"
}

cmd_site_build() {
  cd "$WEB_DIR"
  npm ci
  npx playwright install chromium
  # build:site = generate:content (resume.md → sitePages.ts) + PDFs + bundle. `npm run build:site`
  # does not run npm's `prebuild` hook, so generate:content must be explicit in that script.
  npm run build:site
  echo "Built: $WEB_DIR/dist" >&2
}

cmd_site_deploy() {
  maybe_source_local_env
  if [[ "${SITE_DEPLOY_SKIP_BUILD:-}" != "1" ]]; then
    cmd_site_build
  elif [[ ! -d "$WEB_DIR/dist" ]]; then
    echo "Missing $WEB_DIR/dist — run ./manage-site.sh site-build or deploy without SITE_DEPLOY_SKIP_BUILD=1." >&2
    exit 1
  fi
  ensure_aws_sso
  resolve_deploy_env
  command -v aws >/dev/null 2>&1 || {
    echo "aws CLI not found" >&2
    exit 1
  }
  export SPA_S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID
  DIST="$WEB_DIR/dist" "$ROOT/scripts/deploy-dist-to-s3.sh"
  echo "Deploy complete." >&2
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    infra-create) cmd_infra_create ;;
    infra-destroy) cmd_infra_destroy ;;
    infra-import-bucket) cmd_infra_import_bucket ;;
    site-build) cmd_site_build ;;
    site-deploy) cmd_site_deploy ;;
    help|-h|--help) usage; exit 0 ;;
    "")
      usage
      exit 1
      ;;
    *)
      echo "Unknown command: $cmd" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
