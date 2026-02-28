// @ts-nocheck
import type { Options } from '@wdio/types'
import path from 'path'
import dotenv from 'dotenv'
import { execSync } from 'child_process'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const CI = process.env.CI === 'true'
const USE_EXTERNAL_APPIUM = process.env.USE_EXTERNAL_APPIUM === 'true'

function getConnectedAndroidSerial(): string | undefined {
    try {
        const output = execSync('adb devices', { stdio: 'pipe' }).toString()
        const lines = output
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('List of devices attached'))

        const onlineDevice = lines.find((line) => /\sdevice$/.test(line))
        return onlineDevice ? onlineDevice.split(/\s+/)[0] : undefined
    } catch {
        return undefined
    }
}

// Priority: explicit env serial -> connected adb device -> local default
const UDID = process.env.ANDROID_SERIAL || getConnectedAndroidSerial() || (CI ? undefined : 'emulator-5554')

console.log('\n════════════════════════════════════════')
console.log('📱 DEVICE CONFIGURATION')
console.log('════════════════════════════════════════')
console.log('CI Mode:', CI)
console.log('Using UDID:', UDID)
console.log('Use external Appium:', USE_EXTERNAL_APPIUM)
console.log('════════════════════════════════════════\n')

export const config: Options.Testrunner = {

    runner: 'local',

    hostname: '127.0.0.1',
    port: 4723,
    path: '/',

    services: USE_EXTERNAL_APPIUM
        ? []
        : [[
            'appium',
            {
                command: 'appium',
                args: {
                    address: '127.0.0.1',
                    port: 4723,
                    basePath: '/'
                },
                logPath: './appium-logs'
            }
        ]],

    specs: [
        '../test/specs/**/*.e2e.ts'
    ],

    maxInstances: 1,

    capabilities: [{
        platformName: 'Android',

        'appium:automationName': 'UiAutomator2',

        'appium:deviceName': 'Android Emulator',
        ...(UDID ? { 'appium:udid': UDID } : {}),

        // Only used locally if you start AVD manually
        'appium:avd': CI ? undefined : 'ci-emulator',

        'appium:app': path.resolve(__dirname, '../app/2pisysPPAOperator.apk'),
        'appium:appPackage': 'com.ppaoperator.app',
        'appium:appActivity': 'com.example.app.MainActivity',
        'appium:appWaitActivity': '*',

        'appium:autoGrantPermissions': true,
        'appium:disableWindowAnimation': true,
        'appium:autoLaunch': true,
        'appium:skipDeviceInitialization': false,
        'appium:skipServerInstallation': false,

        'appium:noReset': false,
        'appium:fullReset': false,

        // Stability timeouts (important for CI - be generous)
        'appium:adbExecTimeout': 300000,
        'appium:androidDeviceReadyTimeout': 120,
        'appium:ignoreHiddenApiPolicyError': true,
        'appium:androidInstallTimeout': 300000,
        'appium:uiautomator2ServerLaunchTimeout': 300000,
        'appium:uiautomator2ServerInstallTimeout': 300000,
        'appium:newCommandTimeout': 300,

        // Hybrid app support
        'appium:chromedriverAutodownload': true,
        'appium:ensureWebviewsHavePages': true,
        'appium:recreateChromeDriverSessions': true,
        'appium:webviewConnectTimeout': 20000,
        'appium:webviewConnectRetries': 10,
        'appium:autoWebview': false
    }],

    logLevel: 'info',

    waitforTimeout: 60000,
    connectionRetryTimeout: 600000,  // Increased for Appium device discovery
    connectionRetryCount: 2,

    framework: 'mocha',

    reporters: [
        'spec',
        ['allure', {
            outputDir: path.resolve(__dirname, '../../../reports/mobile/allure-results'),
            reportedEnvironmentVars: {
                Platform: 'Android',
                UDID: String(UDID || 'unknown'),
                CI: CI ? 'Yes' : 'No'
            },
            disableWebdriverStepsReporting: false,
            disableWebdriverScreenshotsReporting: false
        }]
    ],

    mochaOpts: {
        ui: 'bdd',
        timeout: 300000
    },

    // ======================
    // HOOKS
    // ======================

    onPrepare: function () {
        const detectedDevice = getConnectedAndroidSerial()

        console.log('\n===========================================')
        console.log('🚀 Preparing Test Execution')
        console.log('UDID:', UDID)
        console.log('Use external Appium:', USE_EXTERNAL_APPIUM)
        console.log('ADB detected device:', detectedDevice || 'none')
        console.log('===========================================\n')

        if (CI && !detectedDevice && !process.env.ANDROID_SERIAL) {
            throw new Error('No connected Android device found in CI (adb devices returned none).')
        }
    },

    beforeSession: function () {
        console.log('Creating session...')
    },

    afterTest: async function (_test, _context, result: any) {
        if (result.error) {
            try {
                if (browser.sessionId) {
                    await browser.takeScreenshot()
                } else {
                    console.log('Skipping screenshot: no active browser session.')
                }
            } catch (error) {
                console.log('Skipping screenshot due to session or transport error:', error instanceof Error ? error.message : String(error))
            }
        }
    }
}