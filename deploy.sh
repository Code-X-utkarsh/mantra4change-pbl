#!/bin/bash

# Mantra4Change PBL Program Intelligence Dashboard
# One-Click Deployment script to Google Cloud Run and Firebase Hosting

set -e

# Configuration
SERVICE_NAME="mantra-pbl-dashboard"
REGION="us-central1"

echo "============================================="
echo " NGO Dashboard Google Cloud Run Deployer "
echo "============================================="
echo ""
echo "Prerequisites:"
echo " 1. Google Cloud SDK installed (gcloud command)"
echo " 2. Firebase CLI installed (firebase command)"
echo " 3. Active GCP project set up"
echo ""

# Prompt for Project ID if not set
if [ -z "$GCP_PROJECT_ID" ]; then
    read -p "Enter your Google Cloud Project ID: " GCP_PROJECT_ID
fi

if [ -z "$GCP_PROJECT_ID" ]; then
    echo "Error: GCP Project ID is required to deploy."
    exit 1
fi

echo "Setting active project in gcloud..."
gcloud config set project "$GCP_PROJECT_ID"

echo "1. Enabling required Google API services (Artifact Registry, Cloud Build, Cloud Run)..."
gcloud services enable artifactregistry.googleapis.com \
                       cloudbuild.googleapis.com \
                       run.googleapis.com

echo "2. Building container image via Google Cloud Build..."
# This uploads codebase and builds the Docker container inside Google Cloud securely
gcloud builds submit --tag "gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME}:latest"

echo "3. Deploying container to Google Cloud Run..."
# Deploys as a managed service on Cloud Run
gcloud run deploy "$SERVICE_NAME" \
  --image "gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME}:latest" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080

echo "4. Deploying routing and CDN logic to Firebase Hosting..."
# Pulls active hosting rewrites in firebase.json
firebase use --add "$GCP_PROJECT_ID"
firebase deploy --only hosting

echo ""
echo "============================================="
echo " Deployment Successfully Completed!"
echo "============================================="
echo ""
