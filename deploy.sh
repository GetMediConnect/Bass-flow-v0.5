#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  BassFlow — Deploy to Google Cloud Run
#  GCP project: gen-lang-client-0354485869
#  Usage: ./deploy.sh [api|all]
# ═══════════════════════════════════════════════════════════

set -e

PROJECT_ID="gen-lang-client-0354485869"
REGION="europe-west1"
REGISTRY="gcr.io/${PROJECT_ID}"
TARGET="${1:-all}"

echo ""
echo "🎛️  BassFlow Deploy → GCP: $PROJECT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Authenticate ───────────────────────────────────────────
gcloud config set project "$PROJECT_ID"
gcloud auth configure-docker gcr.io --quiet

# ── Validate required env vars ─────────────────────────────
for VAR in JWT_SECRET; do
  if [[ -z "${!VAR}" ]]; then
    echo "❌  Required env var $VAR is not set."
    exit 1
  fi
done

# ── Deploy API ─────────────────────────────────────────────
deploy_api() {
  echo ""
  echo "📦  Building API image…"
  docker build \
    --platform linux/amd64 \
    -t "${REGISTRY}/bassflow-api:latest" \
    -f api/Dockerfile \
    ./api

  echo "📤  Pushing API image…"
  docker push "${REGISTRY}/bassflow-api:latest"

  echo "🚀  Deploying API to Cloud Run…"
  gcloud run deploy bassflow-api \
    --image "${REGISTRY}/bassflow-api:latest" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 3001 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "JWT_SECRET=${JWT_SECRET},NODE_ENV=production"

  API_URL=$(gcloud run services describe bassflow-api \
    --region="$REGION" --format='value(status.url)')
  echo "✅  API live: $API_URL"
  export API_URL
}

case "$TARGET" in
  api) deploy_api ;;
  all) deploy_api ;;
  *)
    echo "Usage: ./deploy.sh [api|all]"
    exit 1
    ;;
esac

echo ""
echo "🎉  Deploy complete!"
echo ""
echo "   API:  ${API_URL:-run: deploy_api first}"
echo ""
echo "   Next steps:"
echo "   • Update VITE_API_URL / bassflow_v6.html API_URL to point to $API_URL"
echo "   • Build Android APK: ./android-build.sh twa release"
