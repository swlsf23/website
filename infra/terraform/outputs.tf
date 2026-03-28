output "spa_bucket_name" {
  value = aws_s3_bucket.spa.bucket
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.spa.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.spa.id
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.spa.domain_name}"
}

output "custom_site_urls" {
  description = "HTTPS URLs when custom_domain_aliases is set."
  value       = [for name in var.custom_domain_aliases : "https://${name}"]
}
