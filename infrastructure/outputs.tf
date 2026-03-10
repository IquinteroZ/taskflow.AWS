# ============================================================
# outputs.tf — URLs and resource names after deploy
# ============================================================

output "api_gateway_url" {
  description = "Base URL for the REST API"
  value       = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "cloudfront_url" {
  description = "Public URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket name (used in CI/CD deploy step)"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront ID (used for cache invalidation in CI/CD)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "tasks_table_name" {
  value = aws_dynamodb_table.tasks.name
}

output "users_table_name" {
  value = aws_dynamodb_table.users.name
}
