#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  BassFlow — Android APK / Play Store Build Script
#  Supports two approaches:
#    1. TWA  (Trusted Web Activity) — recommended for PWA → Play Store
#    2. Capacitor — recommended if you want native features later
# ═══════════════════════════════════════════════════════════
set -e

APPROACH="${1:-twa}"        # twa | capacitor
BUILD_TYPE="${2:-release}"  # debug | release

echo ""
echo "🎵  BassFlow Android Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "    Approach  : $APPROACH"
echo "    Build type: $BUILD_TYPE"
echo ""

# ── Prerequisites check ───────────────────────────────────
check_tool() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌  $1 not found. Install it first."
    echo "   → $2"
    exit 1
  fi
}

check_tool node  "https://nodejs.org"
check_tool npm   "https://nodejs.org"
check_tool java  "https://adoptium.net"

if [[ "$APPROACH" == "capacitor" ]]; then
  check_tool npx  "npm install -g npx"
fi

# ── ① TWA approach (Bubblewrap) ────────────────────────────
if [[ "$APPROACH" == "twa" ]]; then
  echo "📦  Installing @bubblewrap/cli…"
  npm install -g @bubblewrap/cli 2>/dev/null || true

  if [[ ! -d "android-twa" ]]; then
    echo "🏗️   Initialising TWA project from twa-manifest.json…"
    mkdir -p android-twa && cd android-twa
    bubblewrap init --manifest ../twa-manifest.json
    cd ..
  fi

  echo "🔨  Building TWA ($BUILD_TYPE)…"
  cd android-twa
  if [[ "$BUILD_TYPE" == "release" ]]; then
    bubblewrap build --release
    echo ""
    echo "✅  APK: android-twa/app-release-signed.apk"
    echo "✅  AAB: android-twa/app-release.aab  ← upload this to Play Store"
  else
    bubblewrap build
    echo ""
    echo "✅  Debug APK: android-twa/app-debug.apk"
  fi
  cd ..
fi

# ── ② Capacitor approach ───────────────────────────────────
if [[ "$APPROACH" == "capacitor" ]]; then
  echo "📦  Installing Capacitor…"
  npm install @capacitor/core @capacitor/cli @capacitor/android 2>/dev/null

  if [[ ! -d "android" ]]; then
    echo "🏗️   Initialising Android project…"
    npx cap add android
  fi

  echo "🔄  Syncing web assets → Android…"
  npx cap sync android

  echo "🔨  Building APK via Gradle…"
  cd android
  if [[ "$BUILD_TYPE" == "release" ]]; then
    ./gradlew bundleRelease       # produces .aab for Play Store
    ./gradlew assembleRelease     # produces .apk for sideload
    echo ""
    echo "✅  APK:  android/app/build/outputs/apk/release/app-release-unsigned.apk"
    echo "✅  AAB:  android/app/build/outputs/bundle/release/app-release.aab"
    echo ""
    echo "⚠️  Sign the APK/AAB with your keystore before uploading to Play Store:"
    echo "   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \\"
    echo "     -keystore bassflow.keystore app-release-unsigned.apk bassflow"
  else
    ./gradlew assembleDebug
    echo ""
    echo "✅  Debug APK: android/app/build/outputs/apk/debug/app-debug.apk"
    echo "   Install on device: adb install app/build/outputs/apk/debug/app-debug.apk"
  fi
  cd ..
fi

echo ""
echo "═══════════════════════════════════════"
echo "  Play Store upload checklist:"
echo "  1. Create app at play.google.com/console"
echo "  2. Upload .aab file (Internal Testing first)"
echo "  3. Fill Store listing, screenshots, content rating"
echo "  4. Submit for review (usually 1–3 days)"
echo "═══════════════════════════════════════"
echo ""
