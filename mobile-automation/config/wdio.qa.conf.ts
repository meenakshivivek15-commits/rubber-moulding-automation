// @ts-nocheck
import type { Options } from '@wdio/types'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const CI = process.env.CI === 'true'
const USE_EXTERNAL_APPIUM = process.env.USE_EXTERNAL_APPIUM === 'true'

// In CI emulator is always emulator-5554
// Locally you can still override via ANDROID_SERIAL
const UDID = process.env.ANDROID_SERIAL || 'emulator-5554'

console.log('\n════════════════════════════════════════')
console.log('📱 DEVICE CONFIGURATION')
console.log('════════════════════════════════════════')
console.log('CI Mode:', CI)
console.log('Using UDID:', UDID)
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

        // IMPORTANT: must match CI emulator
        'appium:deviceName': UDID,
        'appium:udid': UDID,

        // Only used locally if you start AVD manually
        'appium:avd': CI ? undefined : 'ci-emulator',

        'appium:app': path.resolve(__dirname, '../app/2pisysPPAOperator.apk'),

        'appium:autoGrantPermissions': true,
        'appium:autoLaunch': true,

        'appium:noReset': !CI,
        'appium:fullReset': false,

        // Stability timeouts (important for CI - be generous)
        'appium:adbExecTimeout': 300000,
        'appium:androidInstallTimeout': 300000,
        'appium:uiautomator2ServerLaunchTimeout': 300000,
        'appium:uiautomator2ServerInstallTimeout': 300000,
        'appium:newCommandTimeout': 600000,

        // Hybrid app support
        'appium:chromedriverAutodownload': true,
        'appium:ensureWebviewsHavePages': true,
        'appium:webviewConnectTimeout': 180000,
        'appium:autoWebview': false
    }],

    logLevel: 'info',

    waitforTimeout: 60000,
    connectionRetryTimeout: 600000,  // Increased for Appium device discovery
    connectionRetryCount: 8,  // Retry more times

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
        timeout: 300000
    },

    // ======================
    // HOOKS
    // ======================

    onPrepare: function () {
        console.log('\n===========================================')
        console.log('🚀 Preparing Test Execution')
        console.log('UDID:', UDID)
        console.log('Use external Appium:', USE_EXTERNAL_APPIUM)
        console.log('===========================================\n')
    },

    beforeSession: function () {
        console.log('Creating session...')
    },

    before: async function () {
        const allure = require('@wdio/allure-reporter').default
        allure.addEnvironment('Platform', 'Android')
        allure.addEnvironment('UDID', UDID)
        allure.addEnvironment('CI', CI ? 'Yes' : 'No')
    },

    afterTest: async function (_test, _context, result: any) {
        if (result.error) {
            await browser.takeScreenshot()
        }
    }
}