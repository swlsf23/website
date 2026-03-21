#!/usr/bin/env python3
"""Build apps/web and upload dist/ to S3; invalidate CloudFront."""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "apps" / "web"
DIST = WEB / "dist"


def _run(cmd: list[str], *, cwd: Path) -> None:
    print("+", " ".join(cmd), file=sys.stderr)
    subprocess.run(cmd, cwd=cwd, check=True)


def _upload_dist(bucket: str, prefix: str) -> None:
    import boto3
    from botocore.exceptions import ClientError

    s3 = boto3.client("s3")
    if not DIST.is_dir():
        raise SystemExit(f"Missing {DIST}; run npm run build first.")

    for path in DIST.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(DIST).as_posix()
        key = f"{prefix}/{rel}" if prefix else rel
        extra: dict = {}
        if rel.endswith("index.html"):
            extra["CacheControl"] = "max-age=0,no-cache,no-store,must-revalidate"
        elif "/assets/" in rel or rel.endswith((".js", ".css")):
            extra["CacheControl"] = "max-age=31536000,public,immutable"
        else:
            extra["CacheControl"] = "max-age=3600"
        try:
            s3.upload_file(str(path), bucket, key, ExtraArgs=extra)
        except ClientError as e:
            raise SystemExit(f"S3 upload failed for {key}: {e}") from e
        print(f"uploaded s3://{bucket}/{key}", file=sys.stderr)


def _invalidate(distribution_id: str, paths: list[str]) -> None:
    import boto3

    cf = boto3.client("cloudfront")
    resp = cf.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            "Paths": {"Quantity": len(paths), "Items": paths},
            "CallerReference": f"{int(time.time())}-{uuid.uuid4().hex[:12]}",
        },
    )
    print(f"Invalidation {resp['Invalidation']['Id']} in progress", file=sys.stderr)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--bucket", default=os.environ.get("SPA_S3_BUCKET"), help="S3 bucket (or SPA_S3_BUCKET)")
    p.add_argument(
        "--prefix",
        default=os.environ.get("SPA_S3_PREFIX", ""),
        help="Optional key prefix inside the bucket",
    )
    p.add_argument(
        "--distribution-id",
        default=os.environ.get("CLOUDFRONT_DISTRIBUTION_ID"),
        help="CloudFront distribution ID (or CLOUDFRONT_DISTRIBUTION_ID)",
    )
    p.add_argument("--skip-build", action="store_true", help="Upload existing dist/ only")
    args = p.parse_args()

    if not args.bucket:
        raise SystemExit("Set --bucket or SPA_S3_BUCKET")

    if not args.skip_build:
        if not (WEB / "package.json").is_file():
            raise SystemExit(f"Missing {WEB / 'package.json'}")
        _run(["npm", "ci"], cwd=WEB)
        _run(["npm", "run", "build"], cwd=WEB)

    _upload_dist(args.bucket, args.prefix.strip().strip("/"))

    if args.distribution_id:
        _invalidate(args.distribution_id, ["/*"])
    else:
        print("No --distribution-id; skip CloudFront invalidation", file=sys.stderr)


if __name__ == "__main__":
    main()
