#!/usr/bin/env bash
# Build the Android app and, with --install, put it on a USB-connected device.
# Uses the JDK 21 + Android SDK in ~/.local/android-toolchain unless JAVA_HOME /
# ANDROID_HOME are already set.
set -euo pipefail
cd "$(dirname "$0")/.."
TOOLCHAIN="$HOME/.local/android-toolchain"
export JAVA_HOME="${JAVA_HOME:-$TOOLCHAIN/jdk}"
export ANDROID_HOME="${ANDROID_HOME:-$TOOLCHAIN/sdk}"

npm run build
npx cap sync android
(cd android && ./gradlew --quiet assembleDebug)
APK=android/app/build/outputs/apk/debug/app-debug.apk
echo "Built $APK"

if [[ "${1:-}" == "--install" ]]; then
  adb install -r "$APK"
  adb shell monkey -p fyi.rigel.riceyramen -c android.intent.category.LAUNCHER 1 >/dev/null
  echo "Installed and launched on $(adb shell getprop ro.product.model)"
fi
