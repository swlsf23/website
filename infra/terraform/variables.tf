variable "aws_region" {
  type        = string
  description = "Must be us-east-1: ACM certs used by CloudFront must be created in that region, and this stack uses one AWS provider region for S3 + ACM."
  default     = "us-east-1"

  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "Set aws_region to us-east-1 (required for CloudFront viewer certificates and this module's ACM resources)."
  }
}

variable "spa_bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name for the built SPA."
}

variable "project" {
  type        = string
  description = "Name prefix for resource tags."
  default     = "website"
}

variable "custom_domain_aliases" {
  type        = list(string)
  description = "FQDNs for CloudFront (e.g. sleslie23.com and www.sleslie23.com). Empty = default *.cloudfront.net only."
  default     = []
}

variable "route53_zone_ids" {
  type        = map(string)
  description = "Map apex domain -> Route 53 hosted zone ID for ACM DNS validation and alias records."
  default     = {}
}

variable "github_actions_repository" {
  type        = string
  description = "GitHub repo as owner/name for OIDC (e.g. acme/website). Empty = do not create GitHub deploy IAM role."
  default     = ""
}

variable "github_actions_branch" {
  type        = string
  description = "Branch allowed to assume the deploy role (OIDC sub claim)."
  default     = "main"
}
