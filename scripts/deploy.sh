#!/usr/bin/env bash
set -euo pipefail

: if [ -f ".env" ]; then
    set -a
    # shellcheck source=/dev/null
    source .env
    set +a
  fi

: "${PROJECT_ID:?Set PROJECT_ID to your GCP project ID}"
: "${REGION:=us-central1}"
: "${ARTIFACT_REPOSITORY:=kibitz}"
: "${CLOUD_RUN_REGION:=${REGION}}"
: "${DB_REGION:=${REGION}}"
: "${IMAGE_TAG:=$(git rev-parse --short HEAD)}"
: "${TF_STATE_BUCKET:?Set TF_STATE_BUCKET to the Terraform state bucket name}"

CLOUD_BUILD_CONFIG=${CLOUD_BUILD_CONFIG:-infra/cloudbuild.yaml}
TERRAFORM_DIR=${TERRAFORM_DIR:-infra/terraform}
STATE_PREFIX=${STATE_PREFIX:-kibitz}

cat <<INFO
Deploy configuration
====================
Project:        ${PROJECT_ID}
Region:         ${REGION}
Artifact repo:  ${ARTIFACT_REPOSITORY}
Cloud Run:      ${CLOUD_RUN_REGION}
Image tag:      ${IMAGE_TAG}
State bucket:   ${TF_STATE_BUCKET}
INFO

# Build and push images via Cloud Build
gcloud builds submit \
  --config "${CLOUD_BUILD_CONFIG}" \
  --substitutions _PROJECT_ID="${PROJECT_ID}",_REGION="${REGION}",_REPOSITORY="${ARTIFACT_REPOSITORY}",_IMAGE_TAG="${IMAGE_TAG}"

# Ensure Terraform state bucket exists
if ! gsutil ls -b "gs://${TF_STATE_BUCKET}" >/dev/null 2>&1; then
  echo "Creating Terraform state bucket gs://${TF_STATE_BUCKET}"
  gsutil mb -p "${PROJECT_ID}" -l "${REGION}" "gs://${TF_STATE_BUCKET}"
fi

# Provision infra via Terraform (includes Cloud Run services)
terraform -chdir="${TERRAFORM_DIR}" init -upgrade \
  -backend-config="bucket=${TF_STATE_BUCKET}" \
  -backend-config="prefix=${STATE_PREFIX}"

terraform -chdir="${TERRAFORM_DIR}" apply -auto-approve \
  -var "project_id=${PROJECT_ID}" \
  -var "region=${REGION}" \
  -var "db_region=${DB_REGION}" \
  -var "artifact_repo=${ARTIFACT_REPOSITORY}" \
  -var "image_tag=${IMAGE_TAG}"

terraform -chdir="${TERRAFORM_DIR}" output
