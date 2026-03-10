# ============================================================
# variables.tf
# ============================================================

variable "app_name" {
  description = "Application name prefix for all resources"
  type        = string
  default     = "taskflow"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "jwt_secret" {
  description = "Secret key for JWT signing (min 32 chars)"
  type        = string
  sensitive   = true
}
