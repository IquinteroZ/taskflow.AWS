# infrastructure/environments/dev/terraform.tfvars
# Fill in your values before running terraform apply

app_name    = "taskflow"
environment = "dev"
aws_region  = "us-east-1"

# Generate with: openssl rand -hex 32
# jwt_secret = "SET_ME_VIA_CLI_VAR_OR_TF_VAR_FILE_NEVER_COMMIT"
