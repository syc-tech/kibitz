variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Primary region for regional resources"
  type        = string
  default     = "us-central1"
}

variable "db_region" {
  description = "Region for Cloud SQL instance"
  type        = string
  default     = "us-central1"
}

variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_name" {
  description = "Primary application database name"
  type        = string
  default     = "kibitz"
}

variable "db_user" {
  description = "Database username for the application"
  type        = string
  default     = "kibitz_app"
}

variable "db_password" {
  description = "Optional override for the database user password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "artifact_repo" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "kibitz"
}

variable "image_tag" {
  description = "Container image tag to deploy"
  type        = string
  default     = "latest"
}

variable "sql_instance_name" {
  description = "Cloud SQL instance name"
  type        = string
  default     = "kibitz-sql"
}
