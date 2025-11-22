output "artifact_repo_url" {
  description = "Full Artifact Registry repository path"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "sql_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.primary.connection_name
}

output "db_user" {
  value       = google_sql_user.app.name
  description = "Database username"
}

output "db_password" {
  value       = local.db_password
  description = "Database password"
  sensitive   = true
}

output "db_name" {
  value       = google_sql_database.app.name
  description = "Database name"
}

output "run_service_account_email" {
  value       = google_service_account.run.email
  description = "Service account to run Cloud Run services"
}

output "api_url" {
  description = "Public URL for the API service"
  value       = google_cloud_run_v2_service.api.uri
}

output "web_url" {
  description = "Public URL for the web frontend"
  value       = google_cloud_run_v2_service.web.uri
}
