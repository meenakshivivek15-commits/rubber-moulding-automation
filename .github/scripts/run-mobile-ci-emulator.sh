#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RESULT_FILE="$REPO_ROOT/.github/tmp/mobile-ci-exit-code.txt"
LOGCAT_FILE="$REPO_ROOT/.github/tmp/mobile-logcat.txt"
mkdir -p "$REPO_ROOT/.github/tmp"

APPIUM_PID=""
LOGCAT_PID=""

on_exit() {
  code=$?
  if [ -n "$APPIUM_PID" ]; then
    kill "$APPIUM_PID" >/dev/null 2>&1 || true
  fi
  if [ -n "$LOGCAT_PID" ]; then
    kill "$LOGCAT_PID" >/dev/null 2>&1 || true
  fi
  mkdir -p "$(dirname "$RESULT_FILE")"
  echo "$code" > "$RESULT_FILE"
}

trap on_exit EXIT

echo "Commit: $(git rev-parse --short HEAD)"
echo "===== ADB DEVICES ====="
adb devices

echo "Waiting for emulator device..."
adb wait-for-device

# Ensure shell is responsive on selected emulator serial
EMULATOR_SERIAL="$(adb devices | awk '/emulator-[0-9]+[[:space:]]+device/{print $1; exit}')"
if [ -z "$EMULATOR_SERIAL" ]; then
  echo "No online emulator found after adb wait-for-device ❌"
  adb devices
  exit 1
fi

export ANDROID_SERIAL="$EMULATOR_SERIAL"
echo "Using ANDROID_SERIAL=$ANDROID_SERIAL"

wait_for_system_services() {
  echo "Waiting for shell responsiveness..."
  SHELL_READY=0
  for i in {1..60}; do
    if adb -s "$ANDROID_SERIAL" shell true >/dev/null 2>&1; then
      SHELL_READY=1
      break
    fi
    sleep 2
  done

  if [ "$SHELL_READY" -ne 1 ]; then
    echo "ADB shell did not become responsive within timeout ❌"
    return 1
  fi

  echo "Waiting for Android framework readiness..."
  FRAMEWORK_READY=0
  for i in {1..120}; do
    BOOT_COMPLETED="$(adb -s "$ANDROID_SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
    BOOTANIM="$(adb -s "$ANDROID_SERIAL" shell getprop init.svc.bootanim 2>/dev/null | tr -d '\r')"
    if [ "$BOOT_COMPLETED" = "1" ] && [ "$BOOTANIM" = "stopped" ]; then
      FRAMEWORK_READY=1
      break
    fi
    sleep 2
  done

  if [ "$FRAMEWORK_READY" -ne 1 ]; then
    echo "Android framework did not become ready within timeout ❌"
    adb -s "$ANDROID_SERIAL" shell getprop | head -n 60 || true
    return 1
  fi

  echo "Android framework is ready ✅"

  echo "Waiting for Package Manager service readiness..."
  PACKAGE_READY=0
  PACKAGE_STREAK=0
  for i in {1..120}; do
    SERVICE_CHECK="$(adb -s "$ANDROID_SERIAL" shell service check package 2>/dev/null | tr -d '\r' || true)"

    if echo "$SERVICE_CHECK" | grep -qi "found" && adb -s "$ANDROID_SERIAL" shell cmd package list packages android >/dev/null 2>&1; then
      PACKAGE_STREAK=$((PACKAGE_STREAK + 1))
    else
      PACKAGE_STREAK=0
    fi

    if [ "$PACKAGE_STREAK" -ge 5 ]; then
      PACKAGE_READY=1
      break
    fi

    sleep 2
  done

  if [ "$PACKAGE_READY" -ne 1 ]; then
    echo "Package Manager service not ready within timeout ❌"
    adb -s "$ANDROID_SERIAL" shell service list | head -n 120 || true
    adb -s "$ANDROID_SERIAL" shell getprop | head -n 80 || true
    return 1
  fi

  echo "Package Manager service is ready ✅"

  echo "Waiting for Android settings service readiness..."
  SETTINGS_READY=0
  for i in {1..60}; do
    if adb -s "$ANDROID_SERIAL" shell settings get global device_name >/dev/null 2>&1; then
      SETTINGS_READY=1
      break
    fi
    sleep 2
  done

  if [ "$SETTINGS_READY" -ne 1 ]; then
    echo "Android settings service not ready within timeout ❌"
    adb -s "$ANDROID_SERIAL" shell getprop | head -n 40 || true
    return 1
  fi

  echo "Android settings service is ready ✅"
  adb -s "$ANDROID_SERIAL" shell input keyevent 82 >/dev/null 2>&1 || true
  return 0
}

if ! wait_for_system_services; then
  echo "First readiness pass failed; rebooting emulator once and retrying..."
  adb -s "$ANDROID_SERIAL" reboot || true
  adb -s "$ANDROID_SERIAL" wait-for-device

  if ! wait_for_system_services; then
    echo "System services are still unstable after one reboot ❌"
    exit 1
  fi
fi

echo "Starting adb logcat capture..."
adb -s "$ANDROID_SERIAL" logcat -c || true
adb -s "$ANDROID_SERIAL" logcat -v threadtime > "$LOGCAT_FILE" 2>&1 &
LOGCAT_PID=$!
echo "Logcat capture PID: $LOGCAT_PID"

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

echo "Cleaning previous Allure results..."
mkdir -p allure-results
find allure-results -type f -delete

set +e
npx wdio run config/wdio.qa.conf.ts
TEST_EXIT_CODE=$?
set -e

exit "$TEST_EXIT_CODE"
