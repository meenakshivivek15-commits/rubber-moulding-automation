// @ts-nocheck
import type { Options } from '@wdio/types'
import path from 'path'
import dotenv from 'dotenv'
import { execSync } from 'child_process'

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// =====================================================
// SIMPLE, FOOLPROOF DEVICE DETECTION
// =====================================================

const CI = process.env.CI === 'true'
const DEVICE = process.env.DEVICE
const EXTERNAL_APPIUM = process.env.EXTERNAL_APPIUM === 'true'

// HARDCODED FALLBACKS - These will ALWAYS work
const EMULATOR_UDID = 'emulator-5554'
const DEVICE_UDID = 'device'

// Get the actual UDID - use this ONE source of truth
let FINAL_UDID = ''

if (CI || DEVICE === 'emulator') {
    // CI mode or explicitly using emulator
    // Try env var first (most reliable from workflow)
    const fromEnv = process.env.ANDROID_SERIAL
    if (fromEnv && fromEnv.trim() && fromEnv !== 'undefined') {
        FINAL_UDID = fromEnv.trim()
        console.log('✅ Using ANDROID_SERIAL from env:', FINAL_UDID)
    } else {
        // Env var not available, use hardcoded fallback
        FINAL_UDID = EMULATOR_UDID
        console.log('⚠️  Using hardcoded emulator UDID:', FINAL_UDID)
    }
} else {
    // Real device mode
    const fromEnv = process.env.ANDROID_DEVICE
    if (fromEnv && fromEnv.trim() && fromEnv !== 'undefined') {
        FINAL_UDID = fromEnv.trim()
        console.log('✅ Using ANDROID_DEVICE from env:', FINAL_UDID)
    } else {
        FINAL_UDID = DEVICE_UDID
        console.log('⚠️  Using default device UDID:', FINAL_UDID)
    }
}

// VALIDATE: UDID is NEVER undefined, null, empty, or the string 'undefined'
if (!FINAL_UDID || FINAL_UDID === '' || FINAL_UDID === 'undefined' || FINAL_UDID === 'null') {
    throw new Error(`FATAL: Device UDID is invalid: "${FINAL_UDID}"`)
}

console.log('')
console.log('════════════════════════════════════════')
console.log('📱 DEVICE CONFIGURATION')
console.log('════════════════════════════════════════')
console.log('CI Mode:', CI)
console.log('Device Type:', DEVICE === 'emulator' ? 'EMULATOR' : 'REAL DEVICE')
console.log('Final UDID:', FINAL_UDID)
console.log('════════════════════════════════════════')
console.log('')

if (!process.env.ANDROID_HOME && process.env.ANDROID_SDK_ROOT) {
    process.env.ANDROID_HOME = process.env.ANDROID_SDK_ROOT
}
// =====================================================
// WDIO CONFIG
// =====================================================

export const config: Options.Testrunner & { capabilities: any } = {
    runner: 'local',

    // ==============================
    // Appium 3 Connection
    // ==============================
   

    // Use WDIO Appium service locally, external Appium in CI when requested
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    services: useExternalAppium
        ? []
        : [[
            'appium',
            {
                command: 'appium',
                args: {
                    address: '127.0.0.1',
                    port: 4723,
                    basePath: '/',
                    relaxedSecurity: true,
                    logLevel: 'debug'
                }
            }
        ]],
    specs: [
        '../test/specs/**/*.e2e.ts'
    ],

    maxInstances: 1,

    specFileRetries: 1,
    specFileRetriesDelay: 5,

    // ==============================
    // CAPABILITIES
    // ==============================

    capabilities: [{
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',

        'appium:deviceName': 'Android Device',
        'appium:udid': FINAL_UDID,
        'appium:avd': (DEVICE === 'emulator' && !CI) ? 'ci-emulator' : undefined,

        'appium:app': path.resolve(__dirname, '../app/2pisysPPAOperator.apk'),

        'appium:autoGrantPermissions': true,
        'appium:autoLaunch': true,

        'appium:noReset': !CI,
        'appium:fullReset': false,

        'appium:adbExecTimeout': 120000,
        'appium:androidInstallTimeout': 120000,
        'appium:uiautomator2ServerLaunchTimeout': 120000,
        'appium:uiautomator2ServerInstallTimeout': 120000,
        'appium:newCommandTimeout': 240000,
        'appium:avdLaunchTimeout': 240000,
        'appium:avdReadyTimeout': 240000,

        // Hybrid support
        'appium:chromedriverAutodownload': true,
        'appium:ensureWebviewsHavePages': true,
        'appium:webviewConnectTimeout': 120000,
        'appium:autoWebviewTimeout': 30000,
        'appium:autoWebview': false,
        'appium:nativeWebScreenshot': true,
        'appium:enableWebviewDetailsCollection': true
    }],

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

    // ==============================
    // HOOKS
    // ==============================

    onPrepare: function (config: any) {
        console.log('\n===========================================')
        console.log('✅ onPrepare: Validating capabilities')
        console.log('===========================================')
        console.log('UDID:', config.capabilities[0]['appium:udid'])
        console.log('Device:', config.capabilities[0]['appium:deviceName'])
        console.log('===========================================\n')
    },

    beforeSession: function (_config: any) {
        console.log('📱 beforeSession: About to create Appium session')
    },

    before: async function () {
        const allure = require('@wdio/allure-reporter').default
        allure.addEnvironment('Platform', 'Android')
        allure.addEnvironment('Device', selectedDeviceName || 'Unknown')
        allure.addEnvironment('Execution Mode', useEmulator ? 'Emulator' : 'Real Device')
        allure.addEnvironment('CI', isCI ? 'Yes' : 'No')
    },

    afterTest: async function (_test, _context, result: any) {
        if (result.error) {
            await browser.takeScreenshot()
        }
    }
}