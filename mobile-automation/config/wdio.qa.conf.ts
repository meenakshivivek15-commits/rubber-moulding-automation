// @ts-nocheck
import type { Options } from '@wdio/types'
import path from 'path'
import dotenv from 'dotenv'
import { execSync } from 'child_process'

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// =====================================================
// ENVIRONMENT & DEVICE SWITCHING
// =====================================================

const useEmulator = process.env.DEVICE === 'emulator'
const isCI = process.env.CI === 'true'
const useExternalAppium = process.env.EXTERNAL_APPIUM === 'true'

if (!process.env.ANDROID_HOME && process.env.ANDROID_SDK_ROOT) {
    process.env.ANDROID_HOME = process.env.ANDROID_SDK_ROOT
}

// Real device values (from .env)
const realDeviceUdid = process.env.ANDROID_DEVICE
const realDeviceName = process.env.ANDROID_DEVICE_NAME

// Emulator values - ALWAYS have a hardcoded fallback
const DEFAULT_EMULATOR_SERIAL = 'emulator-5554'
const emulatorName = 'ci-emulator'
const envAndroidSerial = process.env.ANDROID_SERIAL?.trim()

const detectConnectedEmulatorUdid = (): string | undefined => {
    try {
        const output = execSync('adb devices', { encoding: 'utf-8' })
        const lines = output.split('\n').map((line) => line.trim())
        const onlineEmulator = lines.find((line) => /^emulator-\d+\s+device$/.test(line))
        return onlineEmulator?.split(/\s+/)[0]
    } catch {
        return undefined
    }
}

// Resolve emulator UDID with explicit fallback chain
const resolveEmulatorUdid = (): string => {
    // Priority: env var > detected > hardcoded default
    if (envAndroidSerial) {
        console.log('✓ Using ANDROID_SERIAL from env:', envAndroidSerial)
        return envAndroidSerial
    }
    
    const detected = detectConnectedEmulatorUdid()
    if (detected) {
        console.log('✓ Detected emulator from adb:', detected)
        return detected
    }
    
    console.log('⚠️  Falling back to hardcoded DEFAULT_EMULATOR_SERIAL:', DEFAULT_EMULATOR_SERIAL)
    return DEFAULT_EMULATOR_SERIAL
}

// Selected values
const selectedDeviceName = useEmulator ? emulatorName : realDeviceName
const resolvedUdid = useEmulator ? resolveEmulatorUdid() : (realDeviceUdid || 'device')
const resolvedDeviceName = useEmulator
    ? (selectedDeviceName || 'Android Emulator')
    : (selectedDeviceName || 'Android Device')

// CRITICAL VALIDATION: UDID must NEVER be undefined, 'undefined', or empty
if (!resolvedUdid || resolvedUdid === 'undefined' || resolvedUdid.trim() === '') {
    console.error('🔴🔴🔴 FATAL ERROR 🔴🔴🔴')
    console.error('UDID resolved to invalid value:', resolvedUdid)
    console.error('Type:', typeof resolvedUdid)
    console.error('This will cause Appium to fail!')
    throw new Error(`FATAL: Invalid UDID resolved: "${resolvedUdid}"`)
}

console.log('======================================')
console.log('🚀 WDIO Config Initialization')
console.log('======================================')
console.log('All env vars at load time:')
console.log('  DEVICE:', process.env.DEVICE)
console.log('  CI:', process.env.CI)
console.log('  ANDROID_SERIAL:', process.env.ANDROID_SERIAL)
console.log('  ANDROID_DEVICE:', process.env.ANDROID_DEVICE)
console.log('')
console.log('Resolution process:')
console.log('  useEmulator:', useEmulator)
console.log('  resolveEmulatorUdid():', useEmulator ? resolveEmulatorUdid() : 'N/A')
console.log('  realDeviceUdid:', realDeviceUdid)
console.log('')
console.log('Final resolved values:')
console.log('  Mode:', isCI ? 'CI PIPELINE' : 'LOCAL')
console.log('  Type:', useEmulator ? 'EMULATOR' : 'REAL DEVICE')
console.log('  Resolved UDID:', resolvedUdid)
console.log('  Resolved UDID (typeof):', typeof resolvedUdid)
console.log('  Resolved UDID (length):', resolvedUdid.length)
console.log('  Resolved Name:', resolvedDeviceName)
console.log('======================================')
console.log()
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

        'appium:deviceName': resolvedDeviceName,
        'appium:udid': resolvedUdid,  // ALWAYS resolved, never undefined
        'appium:avd': (useEmulator && !isCI) ? emulatorName : undefined,

        'appium:app': path.resolve(__dirname, '../app/2pisysPPAOperator.apk'),

        'appium:autoGrantPermissions': true,
        'appium:autoLaunch': true,

        'appium:noReset': !isCI,
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
        console.log('\n\n===========================================')
        console.log('🔧 onPrepare HOOK - FINAL VALIDATION')
        console.log('===========================================')
        
        if (!config.capabilities || !config.capabilities[0]) {
            throw new Error('CRITICAL: config.capabilities is missing!')
        }
        
        const cap = config.capabilities[0]
        const currentUdid = cap['appium:udid']
        const currentDeviceName = cap['appium:deviceName']
        
        console.log('Current capability values:')
        console.log('  appium:udid:', currentUdid)
        console.log('  appium:deviceName:', currentDeviceName)
        
        // Validate UDID is not undefined or 'undefined'
        if (!currentUdid || currentUdid === 'undefined' || currentUdid === 'undefined') {
            console.error('❌ CRITICAL: UDID is invalid!', currentUdid)
            throw new Error(`CRITICAL: appium:udid is invalid: ${currentUdid}`)
        }
        
        console.log('✅ Device capabilities validated:')
        console.log('  UDID:', currentUdid)
        console.log('  Device Name:', currentDeviceName)
        
        // Show ADB state
        try {
            const adbDevices = execSync('adb devices -l', { encoding: 'utf-8' })
            console.log('\n📱 ADB Devices at hook time:\n', adbDevices)
        } catch (error: any) {
            console.log('⚠️  ADB check failed:', error?.message)
        }
        
        console.log('===========================================\n')
    },

    beforeSession: function (_config: any) {
        console.log('=== beforeSession ===')
        console.log('CI:', isCI)
        console.log('Device:', selectedDeviceName)
        console.log('External Appium:', useExternalAppium)
        try {
            const adbDevices = execSync('adb devices -l', { encoding: 'utf-8' })
            console.log('ADB Devices:\n' + adbDevices)
        } catch (error: any) {
            console.log('ADB Devices check failed:', error?.message || error)
        }
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