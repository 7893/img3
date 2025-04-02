# infrastructure/main.tf

terraform {
  required_version = ">= 1.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.52.0" # 保持与你版本一致
    }
  }
}

provider "cloudflare" {
  # API Token 和 Account ID 通过环境变量提供
  api_token = var.cloudflare_api_token
}

locals {
  # --- 资源名称定义 ---
  date_suffix              = formatdate("YYYYMMDD", timestamp())

  # 存储资源名称
  r2_bucket_name           = "r2-${var.project_name}-${local.date_suffix}"
  d1_db_name               = "d1-unsplash-${local.date_suffix}"
  kv_namespace_name        = "${var.project_name}-kv-cache-${local.date_suffix}"

  # 前端资源名称
  pages_project_name       = var.project_name

  # 后端计算资源名称
  api_worker_name          = "${var.project_name}-api-worker-${local.date_suffix}"
  sync_worker_name         = "${var.project_name}-sync-worker-${local.date_suffix}"
  do_binding_name          = "SYNC_COORDINATOR_DO"
  queue_name               = "${var.project_name}-queue-sync-tasks-${local.date_suffix}"
  queue_binding_name       = "SYNC_TASK_QUEUE"
  kv_binding_name          = "KV_CACHE"
}

# --- 存储资源 ---
resource "cloudflare_r2_bucket" "images" {
  name       = local.r2_bucket_name
  account_id = var.cloudflare_account_id
}

resource "cloudflare_d1_database" "metadata" {
  name       = local.d1_db_name
  account_id = var.cloudflare_account_id
}

resource "cloudflare_workers_kv_namespace" "cache" {
  title      = local.kv_namespace_name
  account_id = var.cloudflare_account_id
}

# --- 前端托管 ---
resource "cloudflare_pages_project" "frontend" {
  name              = local.pages_project_name
  account_id        = var.cloudflare_account_id
  production_branch = "main"
  build_config {
    build_command   = "npm run build"
    destination_dir = ".svelte-kit/cloudflare" # 假设值
    root_dir        = "apps/frontend"
  }

  # 【新增/修改】添加 source 块来连接 GitHub 仓库
  source {
    type = "github"
    config {
      owner             = var.github_owner
      repo_name         = "img3"
      production_branch = "main"                         # 生产分支
      pr_comments_enabled = true                         # (可选) 是否在 PR 中添加评论
      deployments_enabled = true                         # (可选) 是否更新 GitHub 部署状态
      # preview_deployment_setting = "all"               # (可选) 允许所有分支（除了生产分支）创建预览部署
    }
  }
}

# --- 队列定义 ---
resource "cloudflare_queue" "sync_tasks_queue" {
  name       = local.queue_name
  account_id = var.cloudflare_account_id
}

# --- Workers 定义 ---
resource "cloudflare_workers_script" "api_worker" {
  name       = local.api_worker_name
  account_id = var.cloudflare_account_id
  module     = true
  content    = file("${path.module}/placeholder_api.js") # 指向占位符文件
  compatibility_date = "2024-03-01"

  r2_bucket_binding {
    name        = "IMAGE_BUCKET"
    bucket_name = local.r2_bucket_name
  }
  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.metadata.id
  }
  queue_binding {
    binding    = local.queue_binding_name
    queue      = local.queue_name
  }
  kv_namespace_binding {
    name         = local.kv_binding_name
    namespace_id = cloudflare_workers_kv_namespace.cache.id
  }
}

resource "cloudflare_workers_script" "sync_worker" {
  name       = local.sync_worker_name
  account_id = var.cloudflare_account_id
  module     = true
  content    = file("${path.module}/placeholder_sync.js") # 指向占位符文件
  compatibility_date = "2024-03-01"

  r2_bucket_binding {
    name        = "IMAGE_BUCKET"
    bucket_name = local.r2_bucket_name
  }
  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.metadata.id
  }
}

# --- Worker 路由 ---
# 【临时注释掉】
# resource "cloudflare_workers_domain" "api_worker_domain" {
#   account_id = var.cloudflare_account_id
#   hostname   = "${var.cloudflare_workers_dev_account_name}.workers.dev"
#   service    = local.api_worker_name
#   zone_id    = ""
# }

# --- 输出 ---
output "r2_bucket_name" {
  description = "Name of the R2 bucket created"
  value       = cloudflare_r2_bucket.images.name
}
output "d1_database_name" {
  description = "Name of the D1 database created"
  value       = cloudflare_d1_database.metadata.name
}
output "d1_database_id" {
  description = "Internal ID of the D1 database created"
  value       = cloudflare_d1_database.metadata.id
}
output "kv_namespace_id" {
  description = "ID of the KV Namespace created for caching"
  value       = cloudflare_workers_kv_namespace.cache.id
}
output "pages_project_name" {
  description = "Name of the Pages project created"
  value       = cloudflare_pages_project.frontend.name
}
output "pages_project_url" {
  description = "Live URL of the Pages project"
  value       = "https://${cloudflare_pages_project.frontend.domains[0]}"
}
output "do_binding_name" {
  description = "Binding name for the Durable Object (to be configured in wrangler.toml)"
  value       = local.do_binding_name
}
output "queue_name" {
  description = "Name of the Queue created"
  value       = cloudflare_queue.sync_tasks_queue.name
}
output "queue_id" {
  description = "Internal ID of the Queue created"
  value       = cloudflare_queue.sync_tasks_queue.id
}
output "api_worker_name" {
  description = "Name of the API Worker script resource created"
  value       = cloudflare_workers_script.api_worker.name
}
output "sync_worker_name" {
  description = "Name of the Sync Worker script resource created"
  value       = cloudflare_workers_script.sync_worker.name
}
# 【临时注释掉】
# output "api_worker_url" {
#  description = "URL to access the API Worker via workers.dev"
#  value       = "https://${cloudflare_workers_domain.api_worker_domain.hostname}"
# }
