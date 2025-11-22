resource "google_project_service" "required" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudbuild.googleapis.com"
  ])
  project = var.project_id
  service = each.key
}

resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = var.artifact_repo
  description   = "Container images for Kibitz"
  format        = "DOCKER"
  depends_on    = [google_project_service.required]
}

resource "random_password" "db" {
  length  = 20
  special = true
}

locals {
  db_password = var.db_password != "" ? var.db_password : random_password.db.result
  repo_url    = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repo}"
  server_image = "${local.repo_url}/kibitz-server:${var.image_tag}"
  web_image    = "${local.repo_url}/kibitz-web:${var.image_tag}"
}

resource "google_sql_database_instance" "primary" {
  name             = var.sql_instance_name
  project          = var.project_id
  region           = var.db_region
  database_version = "POSTGRES_15"
  settings {
    tier = var.db_tier
    availability_type = "ZONAL"
    ip_configuration {
      ipv4_enabled    = true
      require_ssl     = false
      authorized_networks = []
    }
    backup_configuration {
      enabled = true
    }
  }
  deletion_protection = false
  depends_on          = [google_project_service.required]
}

resource "google_sql_database" "app" {
  name     = var.db_name
  instance = google_sql_database_instance.primary.name
}

resource "google_sql_user" "app" {
  instance = google_sql_database_instance.primary.name
  name     = var.db_user
  password = local.db_password
}

resource "google_service_account" "run" {
  account_id   = "kibitz-runner"
  display_name = "Kibitz Cloud Run runtime"
}

resource "google_project_iam_member" "run_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.run.email}"
}

resource "google_cloud_run_v2_service" "api" {
  name     = "kibitz-api"
  location = var.region
  template {
    service_account = google_service_account.run.email
    containers {
      image = local.server_image
      env {
        name  = "PORT"
        value = "8080"
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "DB_NAME"
        value = google_sql_database.app.name
      }
      env {
        name  = "DB_USER"
        value = google_sql_user.app.name
      }
      env {
        name  = "DB_PASSWORD"
        value = local.db_password
      }
      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.primary.connection_name}"
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.primary.connection_name]
      }
    }
    scaling {
      max_instance_count = 3
    }
  }
  ingress    = "INGRESS_TRAFFIC_ALL"
  depends_on = [google_project_service.required]
}

resource "google_cloud_run_service_iam_member" "api_invoker" {
  location = google_cloud_run_v2_service.api.location
  service  = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service" "worker" {
  name     = "kibitz-worker"
  location = var.region
  template {
    service_account = google_service_account.run.email
    containers {
      image   = local.server_image
      command = ["node"]
      args    = ["server/dist/worker.js"]
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "DB_NAME"
        value = google_sql_database.app.name
      }
      env {
        name  = "DB_USER"
        value = google_sql_user.app.name
      }
      env {
        name  = "DB_PASSWORD"
        value = local.db_password
      }
      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.primary.connection_name}"
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.primary.connection_name]
      }
    }
    scaling {
      max_instance_count = 2
    }
  }
  ingress    = "INGRESS_TRAFFIC_INTERNAL_ONLY"
  depends_on = [google_project_service.required]
}

resource "google_cloud_run_v2_service" "web" {
  name     = "kibitz-web"
  location = var.region
  template {
    service_account = google_service_account.run.email
    containers {
      image = local.web_image
    }
    scaling {
      max_instance_count = 2
    }
  }
  ingress    = "INGRESS_TRAFFIC_ALL"
  depends_on = [google_project_service.required]
}

resource "google_cloud_run_service_iam_member" "web_invoker" {
  location = google_cloud_run_v2_service.web.location
  service  = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
