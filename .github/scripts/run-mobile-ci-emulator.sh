#!/usr/bin/env bash
set -euo pipefail

echo "Commit: $(git rev-parse --short HEAD)"
echo "===== ADB DEVICES ====="
adb devices

echo "Waiting for emulator device..."
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

export ANDROID_SERIAL="$EMULATOR_SERIAL"
echo "Using ANDROID_SERIAL=$ANDROID_SERIAL"

echo "Starting Appium..."
npm install -g appium
appium driver install uiautomator2@4.2.9

appium --address 127.0.0.1 --port 4723 --base-path / --relaxed-security > appium.log 2>&1 &
APPIUM_PID=$!

if ! kill -0 "$APPIUM_PID" 2>/dev/null; then
  echo "Appium process failed right after start ❌"
  cat appium.log || true
  exit 1
fi

echo "Waiting for Appium to be ready..."
APP_READY=0
for i in {1..45}; do
  if ! kill -0 "$APPIUM_PID" 2>/dev/null; then
    echo "Appium exited before becoming ready ❌"
    tail -n 200 appium.log || true
    exit 1
  fi

  if curl -fsS http://127.0.0.1:4723/status >/dev/null; then
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

echo "Appium is ready ✅"
adb start-server
adb devices

CURRENT_SERIAL="$(adb devices | awk '/emulator-[0-9]+[[:space:]]+device/{print $1; exit}')"
if [ -z "$CURRENT_SERIAL" ]; then
  echo "No online emulator found right before WDIO run ❌"
  adb devices
  tail -n 200 appium.log || true
  kill "$APPIUM_PID" || true
  exit 1
fi
echo "Using ANDROID_SERIAL=$CURRENT_SERIAL"

cd mobile-automation
export USE_EXTERNAL_APPIUM=true
export ANDROID_SERIAL="$CURRENT_SERIAL"

set +e
npx wdio run config/wdio.qa.conf.ts
TEST_EXIT_CODE=$?
set -e

kill "$APPIUM_PID" || true
exit "$TEST_EXIT_CODE"
