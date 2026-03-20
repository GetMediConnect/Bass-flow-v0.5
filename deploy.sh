#!/bin/bash
# deploy.sh – deploy BassWave na Google Cloud Run
# Projekt GCP: gen-lang-client-0354485869
# Użycie: ./deploy.sh [api|web|all]

set -e

PROJECT_ID="gen-lang-client-0354485869"
REGION="europe-west1"
REGISTRY="gcr.io/${PROJECT_ID}"

TARGET="${1:-all}"

echo "🎛️  BassWave Deploy → GCP projekt: $PROJECT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Uwierzytelnienie ──────────────────────────────────
gcloud config set project $PROJECT_ID
gcloud auth configure-docker gcr.io --quiet

deploy_api() {
  echo ""
  echo "📦 Buduję obraz API…"
  docker build -t ${REGISTRY}/basswave-api:latest -f apps/api/Dockerfile .
  docker push ${REGISTRY}/basswave-api:latest

  echo "🚀 Deploying API na Cloud Run…"
  gcloud run deploy basswave-api \
    --image ${REGISTRY}/basswave-api:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 3001 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "\
DATABASE_URL=${DATABASE_URL},\
DIRECT_URL=${DIRECT_URL},\
SUPABASE_URL=${SUPABASE_URL},\
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY},\
JWT_SECRET=${JWT_SECRET},\
NODE_ENV=production"

  API_URL=$(gcloud run services describe basswave-api --region=$REGION --format='value(status.url)')
  echo "✅ API live: $API_URL"
  export API_URL
}

deploy_web() {
  echo ""
  echo "📦 Buduję obraz Web…"

  if [ -z "$API_URL" ]; then
    API_URL=$(gcloud run services describe basswave-api --region=$REGION --format='value(status.url)' 2>/dev/null || echo "https://basswave-api-xxx-ew.a.run.app")
  fi

  docker build \
    --build-arg VITE_API_URL=$API_URL \
    -t ${REGISTRY}/basswave-web:latest \
    -f apps/web/Dockerfile .
  docker push ${REGISTRY}/basswave-web:latest

  echo "🚀 Deploying Web na Cloud Run…"
  gcloud run deploy basswave-web \
    --image ${REGISTRY}/basswave-web:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5

  WEB_URL=$(gcloud run services describe basswave-web --region=$REGION --format='value(status.url)')
  echo "✅ Web live: $WEB_URL"
}

case $TARGET in
  api) deploy_api ;;
  web) deploy_web ;;
  all) deploy_api && deploy_web ;;
  *)
    echo "Użycie: ./deploy.sh [api|web|all]"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deploy zakończony!"
