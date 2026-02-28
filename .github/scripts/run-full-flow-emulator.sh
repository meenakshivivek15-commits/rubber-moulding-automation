#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RESULT_FILE="$REPO_ROOT/.github/tmp/full-flow-exit-code.txt"
mkdir -p "$REPO_ROOT/.github/tmp"

cleanup() {
  code=$?
  adb -s emulator-5554 emu kill || true
  echo "$code" > "$RESULT_FILE"
}

trap cleanup EXIT

cd "$REPO_ROOT"

echo "===== ADB DEVICES ====="
adb devices

adb wait-for-device

echo "Waiting for Android boot completion..."
for i in {1..60}; do
  BOOT_COMPLETED="$(adb shell getprop sys.boot_completed | tr -d '\r')"
  if [ "$BOOT_COMPLETED" = "1" ]; then
    echo "Emulator boot completed ✅"
    break
  fi
  sleep 2
done

EMULATOR_SERIAL="$(adb devices | awk '/emulator-[0-9]+[[:space:]]+device/{print $1; exit}')"
if [ -z "$EMULATOR_SERIAL" ]; then
  echo "No online emulator found ❌"
  adb devices
  exit 1
fi

echo "Using ANDROID_SERIAL=$EMULATOR_SERIAL"
export ANDROID_SERIAL="$EMULATOR_SERIAL"
export USE_EXTERNAL_APPIUM=true

npx appium driver install uiautomator2@4.2.9
npx appium --address 127.0.0.1 --port 4723 --base-path / --relaxed-security > appium.log 2>&1 &
APPIUM_PID=$!

APP_READY=0
for i in {1..45}; do
  if curl -fsS http://127.0.0.1:4723/status >/dev/null; then
    echo "Appium is ready ✅"
    APP_READY=1
    break
  fi
  sleep 2
done

if [ "$APP_READY" -ne 1 ]; then
  echo "Appium did not become ready within timeout ❌"
  tail -n 200 appium.log || true
  kill "$APPIUM_PID" || true
  exit 1
fi

adb start-server
adb devices
CURRENT_SERIAL="$(adb devices | awk '/emulator-[0-9]+[[:space:]]+device/{print $1; exit}')"
if [ -z "$CURRENT_SERIAL" ]; then
  echo "No online emulator found right before full:e2e ❌"
  adb devices
  tail -n 200 appium.log || true
  kill "$APPIUM_PID" || true
  exit 1
fi

export ANDROID_SERIAL="$CURRENT_SERIAL"
echo "Using ANDROID_SERIAL=$ANDROID_SERIAL"

set +e
npm run full:e2e
TEST_EXIT_CODE=$?
set -e

kill "$APPIUM_PID" || true
exit "$TEST_EXIT_CODE"
