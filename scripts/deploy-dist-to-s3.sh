#!/usr/bin/env bash
# Upload apps/web/dist to S3 + invalidate CloudFront. Used by manage-site.sh site-deploy
# and .github/workflows/deploy.yml so cache headers stay consistent.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="${DIST:-$ROOT/apps/web/dist}"

: "${SPA_S3_BUCKET:?Set SPA_S3_BUCKET}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID}"

if [[ ! -d "$DIST" ]]; then
  echo "Missing dist directory: $DIST" >&2
  exit 1
fi

# s-maxage=0: shared caches (CloudFront) should not treat HTML/PDF as long-lived at same URL.
HTML_CACHE='public, max-age=0, s-maxage=0, must-revalidate, no-cache'
PDF_CACHE='public, max-age=0, s-maxage=0, must-revalidate'

aws s3 sync "$DIST/" "s3://${SPA_S3_BUCKET}/" --delete

aws s3 cp "$DIST/index.html" "s3://${SPA_S3_BUCKET}/index.html" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "$HTML_CACHE" \
  --metadata-directive REPLACE

for f in resume.pdf writing-samples.pdf; do
  if [[ -f "$DIST/$f" ]]; then
    aws s3 cp "$DIST/$f" "s3://${SPA_S3_BUCKET}/$f" \
      --content-type "application/pdf" \
      --cache-control "$PDF_CACHE" \
      --metadata-directive REPLACE
  fi
done

aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --output text

echo "S3 deploy + CloudFront invalidation complete." >&2
