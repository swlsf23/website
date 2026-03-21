variable "aws_region" {
  type        = string
  description = "Region for S3 and Terraform provider (CloudFront is global)."
  default     = "us-east-1"
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
