// @ts-nocheck
import type { Options } from '@wdio/types'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const CI = process.env.CI === 'true'
const EXTERNAL_APPIUM = process.env.EXTERNAL_APPIUM === 'true'

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

    services: EXTERNAL_APPIUM
        ? []
        : [[
            'appium',
            {
                command: 'appium',
                args: {
                    address: '127.0.0.1',
                    port: 4723,
                    basePath: '/',
                    relaxedSecurity: true
                }
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

    onPrepare: function (config: any) {
        console.log('\n===========================================')
        console.log('🚀 Preparing Test Execution')
        console.log('UDID:', config.capabilities[0]['appium:udid'])
        console.log('===========================================\n')
    },

    beforeSession: async function () {
        const { execSync } = require('child_process')
        const sleepMs = 40000
        console.log(`⏳ Waiting ${sleepMs / 1000}s before WDIO session start...`)
        await new Promise(resolve => setTimeout(resolve, sleepMs))
        console.log('📱 Pre-session device verification...')
        
        try {
            // Verify device is still online
            const state = execSync(`adb -s ${UDID} get-state`, { encoding: 'utf-8' }).trim()
            console.log(`✓ Device ${UDID} state: ${state}`)
            
            if (state !== 'device') {
                throw new Error(`Device state is "${state}", expected "device"`)
            }
            
            // Verify boot is complete
            const bootComplete = execSync(`adb -s ${UDID} shell getprop sys.boot_completed`, { encoding: 'utf-8' }).trim()
            console.log(`✓ Boot completed: ${bootComplete}`)
            
            console.log('✅ Device ready for Appium session\n')
        } catch (error: any) {
            console.error('❌ Device verification failed:', error.message)
            throw error
        }
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