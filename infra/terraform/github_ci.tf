# Optional GitHub Actions deploy role (OIDC). Set github_actions_repository to owner/repo (e.g. "acme/website").
# If the account already has an IAM OIDC provider for token.actions.githubusercontent.com, run:
#   terraform import 'aws_iam_openid_connect_provider.github_actions[0]' token.actions.githubusercontent.com

locals {
  github_ci_enabled = var.github_actions_repository != ""
}

data "tls_certificate" "github_oidc" {
  count = local.github_ci_enabled ? 1 : 0
  url   = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  count = local.github_ci_enabled ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_oidc[0].certificates[0].sha1_fingerprint]
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "github_deploy" {
  count = local.github_ci_enabled ? 1 : 0
  name  = "${var.project}-github-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github_actions[0].arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_actions_repository}:ref:refs/heads/${var.github_actions_branch}"
        }
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "github_deploy" {
  count = local.github_ci_enabled ? 1 : 0
  name  = "${var.project}-github-deploy-s3-cf"
  role  = aws_iam_role.github_deploy[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SpaBucketSync"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.spa.arn,
          "${aws_s3_bucket.spa.arn}/*",
        ]
      },
      {
        Sid      = "CloudFrontInvalidate"
        Effect   = "Allow"
        Action   = "cloudfront:CreateInvalidation"
        Resource = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.spa.id}"
      }
    ]
  })
}
