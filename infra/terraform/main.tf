locals {
  tags = {
    Project = var.project
  }
  custom_domain_enabled = length(var.custom_domain_aliases) > 0
  # Map each FQDN to apex (e.g. www.sleslie23.com -> sleslie23.com) for Route 53 zone lookup.
  apex_domain = {
    for fqdn in var.custom_domain_aliases : fqdn => join(".", slice(split(".", fqdn), length(split(".", fqdn)) - 2, length(split(".", fqdn))))
  }
}

resource "aws_s3_bucket" "spa" {
  bucket        = var.spa_bucket_name
  force_destroy = true # Terraform deletes bucket contents before deleting the bucket on destroy
  tags          = local.tags
}

resource "aws_s3_bucket_versioning" "spa" {
  bucket = aws_s3_bucket.spa.id
  versioning_configuration {
    status = "Suspended"
  }
}

resource "aws_s3_bucket_public_access_block" "spa" {
  bucket = aws_s3_bucket.spa.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "spa" {
  name                              = "${var.project}-spa-oac"
  description                       = "OAC for SPA bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "cors_s3" {
  name = "Managed-CORS-S3Origin"
}

resource "aws_cloudfront_distribution" "spa" {
  enabled                 = true
  is_ipv6_enabled       = true
  comment                 = "${var.project} SPA"
  default_root_object     = "index.html"
  price_class             = "PriceClass_100"
  aliases                 = var.custom_domain_aliases
  wait_for_deployment     = true

  origin {
    domain_name              = aws_s3_bucket.spa.bucket_regional_domain_name
    origin_id                = "s3-spa"
    origin_access_control_id = aws_cloudfront_origin_access_control.spa.id
  }

  default_cache_behavior {
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "s3-spa"
    compress                 = true
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3.id
    viewer_protocol_policy   = "redirect-to-https"
  }

  # Client-side routing: serve index.html for unknown paths
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = !local.custom_domain_enabled
    # Use validated cert ARN so this resource waits for aws_acm_certificate_validation (depends_on must be static).
    acm_certificate_arn      = length(aws_acm_certificate_validation.spa) > 0 ? aws_acm_certificate_validation.spa[0].certificate_arn : null
    ssl_support_method       = local.custom_domain_enabled ? "sni-only" : null
    minimum_protocol_version = local.custom_domain_enabled ? "TLSv1.2_2021" : null
  }

  tags = local.tags

  depends_on = [aws_s3_bucket_public_access_block.spa]
}

data "aws_iam_policy_document" "spa_oac" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.spa.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.spa.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "spa" {
  bucket = aws_s3_bucket.spa.id
  policy = data.aws_iam_policy_document.spa_oac.json

  depends_on = [aws_cloudfront_distribution.spa]
}
