resource "aws_acm_certificate" "spa" {
  count = local.custom_domain_enabled ? 1 : 0

  domain_name               = var.custom_domain_aliases[0]
  subject_alternative_names = length(var.custom_domain_aliases) > 1 ? slice(var.custom_domain_aliases, 1, length(var.custom_domain_aliases)) : []
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
    precondition {
      condition = alltrue([
        for fqdn in var.custom_domain_aliases : contains(keys(var.route53_zone_ids), local.apex_domain[fqdn])
      ])
      error_message = "Each custom domain must have its apex as a key in route53_zone_ids (e.g. sleslie23.com = zone id)."
    }
  }

  tags = local.tags
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.custom_domain_enabled ? {
    for dvo in aws_acm_certificate.spa[0].domain_validation_options : dvo.domain_name => {
      name    = dvo.resource_record_name
      record  = dvo.resource_record_value
      type    = dvo.resource_record_type
      zone_id = var.route53_zone_ids[local.apex_domain[dvo.domain_name]]
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = each.value.zone_id
}

resource "aws_acm_certificate_validation" "spa" {
  count = local.custom_domain_enabled ? 1 : 0

  certificate_arn         = aws_acm_certificate.spa[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

resource "aws_route53_record" "spa_alias_a" {
  for_each = local.custom_domain_enabled ? toset(var.custom_domain_aliases) : toset([])

  allow_overwrite = true
  zone_id         = var.route53_zone_ids[local.apex_domain[each.value]]
  name            = each.value
  type            = "A"

  alias {
    name                   = aws_cloudfront_distribution.spa.domain_name
    zone_id                = aws_cloudfront_distribution.spa.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "spa_alias_aaaa" {
  for_each = local.custom_domain_enabled ? toset(var.custom_domain_aliases) : toset([])

  allow_overwrite = true
  zone_id         = var.route53_zone_ids[local.apex_domain[each.value]]
  name            = each.value
  type            = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.spa.domain_name
    zone_id                = aws_cloudfront_distribution.spa.hosted_zone_id
    evaluate_target_health = false
  }
}
