# infrastructure/variables.tf

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare Account ID."
  nullable    = false # 必须提供
}

variable "cloudflare_workers_dev_account_name" {
  type        = string
  description = "The account name part of your *.workers.dev subdomain (e.g., 'your-account')."
  nullable    = false # 必须提供
}

variable "github_owner" {
  type        = string
  description = "The owner of the GitHub repository."
  default     = "7893"
}

variable "project_name" {
  type        = string
  description = "The name of the project."
  default     = "img3"
}

variable "unsplash_access_key" {
  type        = string
  sensitive   = true
  description = "Unsplash API Access Key (set via env var TF_VAR_unsplash_access_key)"
  nullable    = true
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API Token (set via env var TF_VAR_cloudflare_api_token)"
  nullable    = false
}
