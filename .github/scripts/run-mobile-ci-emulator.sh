#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RESULT_FILE="$REPO_ROOT/.github/tmp/mobile-ci-exit-code.txt"
LOGCAT_FILE="$REPO_ROOT/.github/tmp/mobile-logcat.txt"
STATE_FILE="$REPO_ROOT/.github/tmp/mobile-ci-state.json"
RUNTIME_FILE="$REPO_ROOT/common/test-data/runtime/runtimeData.json"
mkdir -p "$REPO_ROOT/.github/tmp"

APPIUM_PID=""
LOGCAT_PID=""

write_state() {
  local status="$1"
  local step="$2"
  local message="$3"
  local ts
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  cat > "$STATE_FILE" <<EOF
{"status":"$status","step":"$step","message":"$message","updatedAt":"$ts"}
EOF
}

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

  if [ "$code" -eq 0 ]; then
    write_state "passed" "mobile-tests" "Mobile tests completed successfully"
  else
    if [ ! -f "$STATE_FILE" ]; then
      write_state "infra_failed" "bootstrap" "Mobile test script failed before state initialization"
    else
      CURRENT_STATUS="$(node -e "const fs=require('fs');try{const s=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));console.log(s.status||'unknown')}catch{console.log('unknown')}" "$STATE_FILE")"

      if [ "$CURRENT_STATUS" = "running" ]; then
        write_state "failed" "mobile-tests" "Mobile tests failed"
      elif [ "$CURRENT_STATUS" = "unknown" ]; then
        write_state "infra_failed" "bootstrap" "Mobile test script failed with unknown state"
      fi
    fi
  fi
}

trap on_exit EXIT

write_state "running" "bootstrap" "Mobile test bootstrap started"

wait_for_system_services() {
  service_is_found() {
    local service_name="$1"
    local output
    output="$(adb -s "$ANDROID_SERIAL" shell service check "$service_name" 2>/dev/null | tr -d '\r' || true)"

    if echo "$output" | grep -Eiq "not[[:space:]]+found"; then
      return 1
    fi

    if echo "$output" | grep -Eiq "(^|:)[[:space:]]*found([[:space:]]|$)"; then
      return 0
    fi

    return 1
  }

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

    if [ $((i % 10)) -eq 0 ]; then
      echo "Framework readiness poll $i/120: sys.boot_completed='${BOOT_COMPLETED:-<empty>}' bootanim='${BOOTANIM:-<empty>}'"
    fi

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
    if service_is_found "package" && adb -s "$ANDROID_SERIAL" shell cmd package list packages android >/dev/null 2>&1; then
      PACKAGE_STREAK=$((PACKAGE_STREAK + 1))
    else
      PACKAGE_STREAK=0
    fi

    if [ "$PACKAGE_STREAK" -ge 5 ]; then
      PACKAGE_READY=1
      break
    fi

    if [ $((i % 10)) -eq 0 ]; then
      PACKAGE_SERVICE_CHECK="$(adb -s "$ANDROID_SERIAL" shell service check package 2>/dev/null | tr -d '\r' || true)"
      if adb -s "$ANDROID_SERIAL" shell cmd package list packages android >/dev/null 2>&1; then
        PACKAGE_CMD_OK="yes"
      else
        PACKAGE_CMD_OK="no"
      fi
      echo "Package readiness poll $i/120: streak=$PACKAGE_STREAK service_check='${PACKAGE_SERVICE_CHECK:-<empty>}' cmd_package_ok=$PACKAGE_CMD_OK"
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

  echo "Waiting for Activity Manager service readiness..."
  ACTIVITY_READY=0
  ACTIVITY_STREAK=0
  for i in {1..120}; do
    if service_is_found "activity" && adb -s "$ANDROID_SERIAL" shell cmd activity get-config >/dev/null 2>&1; then
      ACTIVITY_STREAK=$((ACTIVITY_STREAK + 1))
    else
      ACTIVITY_STREAK=0
    fi

    if [ "$ACTIVITY_STREAK" -ge 5 ]; then
      ACTIVITY_READY=1
      break
    fi

    if [ $((i % 10)) -eq 0 ]; then
      ACTIVITY_SERVICE_CHECK="$(adb -s "$ANDROID_SERIAL" shell service check activity 2>/dev/null | tr -d '\r' || true)"
      if adb -s "$ANDROID_SERIAL" shell cmd activity get-config >/dev/null 2>&1; then
        ACTIVITY_CMD_OK="yes"
      else
        ACTIVITY_CMD_OK="no"
      fi
      echo "Activity readiness poll $i/120: streak=$ACTIVITY_STREAK service_check='${ACTIVITY_SERVICE_CHECK:-<empty>}' cmd_activity_ok=$ACTIVITY_CMD_OK"
    fi

    sleep 2
  done

  if [ "$ACTIVITY_READY" -ne 1 ]; then
    echo "Activity Manager service not ready within timeout ❌"
    adb -s "$ANDROID_SERIAL" shell service list | head -n 120 || true
    adb -s "$ANDROID_SERIAL" shell getprop | head -n 80 || true
    return 1
  fi

  echo "Activity Manager service is ready ✅"

  echo "Waiting for Android settings service readiness..."
  SETTINGS_READY=0
  for i in {1..60}; do
    SETTINGS_DEVICE_NAME="$(adb -s "$ANDROID_SERIAL" shell settings get global device_name 2>/dev/null | tr -d '\r' || true)"

    if [ $((i % 10)) -eq 0 ]; then
      echo "Settings readiness poll $i/60: device_name='${SETTINGS_DEVICE_NAME:-<empty>}'"
    fi

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

start_appium_and_wait() {
  appium --address 127.0.0.1 --port 4723 --base-path / --relaxed-security > appium.log 2>&1 &
  APPIUM_PID=$!

  if ! kill -0 "$APPIUM_PID" 2>/dev/null; then
    echo "Appium process failed right after start ❌"
    cat appium.log || true
    return 1
  fi

  echo "Waiting for Appium to be ready..."
  APP_READY=0
  for i in {1..45}; do
    if ! kill -0 "$APPIUM_PID" 2>/dev/null; then
      echo "Appium exited before becoming ready ❌"
      tail -n 200 appium.log || true
      return 1
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
    kill "$APPIUM_PID" >/dev/null 2>&1 || true
    APPIUM_PID=""
    return 1
  fi

  echo "Appium is ready ✅"
  return 0
}

echo "Commit: $(git rev-parse --short HEAD)"
echo "===== ADB DEVICES ====="
adb devices

echo "Waiting for emulator device..."
adb wait-for-device

EMULATOR_SERIAL="$(adb devices | awk '/emulator-[0-9]+[[:space:]]+device/{print $1; exit}')"
if [ -z "$EMULATOR_SERIAL" ]; then
  echo "No online emulator found after adb wait-for-device ❌"
  adb devices
  exit 1
fi

export ANDROID_SERIAL="$EMULATOR_SERIAL"
echo "Using ANDROID_SERIAL=$ANDROID_SERIAL"

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

echo "Installing Appium + uiautomator2 driver..."
npm install -g appium
appium driver install uiautomator2@4.2.9

echo "Starting Appium..."
if ! start_appium_and_wait; then
  exit 1
fi

adb start-server
adb devices

CURRENT_SERIAL="$(adb devices | awk '/emulator-[0-9]+[[:space:]]+device/{print $1; exit}')"
if [ -z "$CURRENT_SERIAL" ]; then
  echo "No online emulator found right before web prerequisites ❌"
  adb devices
  tail -n 200 appium.log || true
  exit 1
fi

echo "Using ANDROID_SERIAL=$CURRENT_SERIAL"

cd "$REPO_ROOT/mobile-automation"
echo "Cleaning previous mobile Allure results..."
mkdir -p allure-results
find allure-results -type f -delete

echo "Running full-flow prerequisites: Create PO and Approve PO..."
cd "$REPO_ROOT/web-app-automation"

if [ ! -d "node_modules" ]; then
  echo "web-app-automation/node_modules missing; installing web dependencies..."
  npm ci
fi

echo "Ensuring Playwright browser binaries are installed..."
npx playwright install chromium

npx playwright test tests/planner/purchase/plan/purchaseorder.spec.ts --config=config/playwright.qa.config.ts
npx playwright test tests/planner/purchase/approval/po-approval.spec.ts --config=config/playwright.qa.config.ts

cd "$REPO_ROOT"
if [ -f "$RUNTIME_FILE" ]; then
  echo "Runtime PO after approval:"
  node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));const po=j.poNumber||'';console.log(po||'poNumber missing');if(!po){process.exit(2)}" "$RUNTIME_FILE"
else
  echo "Runtime file not found after PO creation/approval: $RUNTIME_FILE"
  exit 1
fi

echo "Waiting 60 seconds for PO propagation before goods receipt..."
sleep 60

export ANDROID_SERIAL="$CURRENT_SERIAL"

echo "Re-validating Android services before WDIO session..."
if ! wait_for_system_services; then
  echo "Android services degraded before WDIO; rebooting emulator and retrying readiness..."
  adb -s "$ANDROID_SERIAL" reboot || true
  adb -s "$ANDROID_SERIAL" wait-for-device

  if ! wait_for_system_services; then
    echo "Android services still unstable before WDIO ❌"
    exit 1
  fi
fi

echo "Restarting Appium before WDIO session creation..."
if [ -n "$APPIUM_PID" ]; then
  kill "$APPIUM_PID" >/dev/null 2>&1 || true
  APPIUM_PID=""
  sleep 2
fi

if ! start_appium_and_wait; then
  exit 1
fi

cd "$REPO_ROOT/mobile-automation"
export USE_EXTERNAL_APPIUM=true
export ANDROID_SERIAL="$CURRENT_SERIAL"

write_state "running" "mobile-tests" "WDIO execution started"

set +e
npx wdio run config/wdio.qa.conf.ts
TEST_EXIT_CODE=$?
set -e

if [ "$TEST_EXIT_CODE" -eq 0 ]; then
  write_state "passed" "mobile-tests" "WDIO execution completed successfully"
else
  write_state "failed" "mobile-tests" "WDIO execution failed"
fi

exit "$TEST_EXIT_CODE"
