import type { Options } from '@wdio/types'
import path from 'path'
import dotenv from 'dotenv'

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// =====================================================
// ENVIRONMENT & DEVICE SWITCHING
// =====================================================

const useEmulator = process.env.DEVICE === 'emulator'
const isCI = process.env.CI === 'true'

// Real device values (from .env)
const realDeviceUdid = process.env.ANDROID_DEVICE
const realDeviceName = process.env.ANDROID_DEVICE_NAME

// Emulator values
const emulatorUdid = 'emulator-5554'
const emulatorName = 'ci-emulator'

// Selected values
const selectedUdid = useEmulator ? emulatorUdid : realDeviceUdid
const selectedDeviceName = useEmulator ? emulatorName : realDeviceName

console.log('======================================')
console.log('Execution Mode:', isCI ? 'CI PIPELINE' : 'LOCAL')
console.log('Running on:', useEmulator ? 'EMULATOR' : 'REAL DEVICE')
console.log('Device Name:', selectedDeviceName)
console.log('UDID:', selectedUdid)
console.log('======================================')

export const config: WebdriverIO.Config = {

    runner: 'local',

    // ❌ DO NOT define hostname/port when using Appium service
    // WDIO service will start and manage Appium automatically

    services: [],

    specs: [
        '../test/specs/**/*.e2e.ts'
    ],

    maxInstances: 1,

    specFileRetries: 1,
    specFileRetriesDelay: 5,

    capabilities: [{
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',

        // ==============================
        // DEVICE
        // ==============================
        'appium:deviceName': selectedDeviceName,
        'appium:udid': selectedUdid,

        // ==============================
        // APP
        // ==============================
        'appium:app': path.resolve(__dirname, '../app/2pisysPPAOperator.apk'),

        'appium:autoGrantPermissions': true,
        'appium:autoLaunch': true,

        // Clean install in CI, keep state locally
        'appium:noReset': !isCI,
        'appium:fullReset': false,

        // ==============================
        // STABILITY
        // ==============================
        'appium:adbExecTimeout': 120000,
        'appium:androidInstallTimeout': 120000,
        'appium:uiautomator2ServerLaunchTimeout': 120000,
        'appium:uiautomator2ServerInstallTimeout': 120000,
        'appium:newCommandTimeout': 240000,
        'appium:avdLaunchTimeout': 240000,
        'appium:avdReadyTimeout': 240000,

        // ==============================
        // HYBRID WEBVIEW SUPPORT
        // ==============================
        'appium:chromedriverAutodownload': true,
        'appium:ensureWebviewsHavePages': true,
        'appium:webviewConnectTimeout': 120000,
        'appium:autoWebviewTimeout': 30000,
        'appium:autoWebview': false,
        'appium:nativeWebScreenshot': true,
        'appium:enableWebviewDetailsCollection': true

    } as any],

    logLevel: 'info',

    waitforTimeout: 20000,
    connectionRetryTimeout: 180000,
    connectionRetryCount: 5,

    framework: 'mocha',

    reporters: [
        'spec',
        ['allure', {
            outputDir: path.resolve(__dirname, '../../../reports/mobile/allure-results'),
            disableWebdriverStepsReporting: false,
            disableWebdriverScreenshotsReporting: false
        }]
    ],

    mochaOpts: {
        ui: 'bdd',
        timeout: 180000
    },

    // ==========================================
    // HOOKS
    // ==========================================

    beforeSession: function () {
        console.log('CI:', isCI)
        console.log('Device:', selectedDeviceName)
    },

    before: async function () {
        const allure = require('@wdio/allure-reporter').default
        allure.addEnvironment('Platform', 'Android')
        allure.addEnvironment('Device', selectedDeviceName || 'Unknown')
        allure.addEnvironment('Execution Mode', useEmulator ? 'Emulator' : 'Real Device')
        allure.addEnvironment('CI', isCI ? 'Yes' : 'No')
    },

    afterTest: async function (_test, _context, result) {
        if (result.error) {
            await browser.takeScreenshot()
        }
    }
}