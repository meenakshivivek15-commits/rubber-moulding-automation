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

// Emulator values
const emulatorUdid = 'emulator-5554'
const emulatorName = 'ci-emulator'
const ciEmulatorUdid = process.env.ANDROID_SERIAL?.trim()

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

// Selected values
const selectedUdid = useEmulator ? emulatorUdid : realDeviceUdid
const selectedDeviceName = useEmulator
    ? emulatorName
    : realDeviceName
const detectedCiUdid = (useEmulator && isCI) ? detectConnectedEmulatorUdid() : undefined
const resolvedUdid = useEmulator
    ? (ciEmulatorUdid || detectedCiUdid || emulatorUdid)
    : selectedUdid
const resolvedDeviceName = useEmulator
    ? (selectedDeviceName || 'Android Emulator')
    : (selectedDeviceName || 'Android Device')

console.log('======================================')
console.log('🚀 WDIO Config Initialization')
console.log('======================================')
console.log('Execution Mode:', isCI ? 'CI PIPELINE' : 'LOCAL')
console.log('Running on:', useEmulator ? 'EMULATOR' : 'REAL DEVICE')
console.log('Device Name:', selectedDeviceName)
console.log('Detected CI UDID:', detectedCiUdid)
console.log('Resolved UDID:', resolvedUdid)
console.log('Resolved Device Name:', resolvedDeviceName)
console.log('ENV ANDROID_SERIAL:', process.env.ANDROID_SERIAL)
console.log('ENV DEVICE:', process.env.DEVICE)
console.log('ENV CI:', process.env.CI)
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

        'appium:deviceName': resolvedDeviceName || 'Android',
        'appium:udid': resolvedUdid || emulatorUdid,
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
        console.log('🔧 onPrepare HOOK EXECUTING')
        console.log('===========================================')
        console.log('ENV ANDROID_SERIAL:', process.env.ANDROID_SERIAL)
        console.log('ENV ANDROID_HOME:', process.env.ANDROID_HOME)
        console.log('ENV DEVICE:', process.env.DEVICE)
        console.log('ENV CI:', process.env.CI)
        console.log('useEmulator variable:', useEmulator)
        console.log('isCI variable:', isCI)
        console.log('resolvedUdid variable:', resolvedUdid)
        console.log('emulatorUdid variable:', emulatorUdid)
        console.log('Current config.capabilities:', JSON.stringify(config.capabilities, null, 2))
        
        if (useEmulator && config.capabilities && config.capabilities[0]) {
            const currentAdbUdid = detectConnectedEmulatorUdid()
            const sessionUdid = currentAdbUdid || process.env.ANDROID_SERIAL?.trim() || resolvedUdid || emulatorUdid
            console.log('🎯 Detected ADB UDID:', currentAdbUdid)
            console.log('🎯 Final session UDID will be:', sessionUdid)
            
            config.capabilities[0]['appium:udid'] = sessionUdid
            config.capabilities[0]['appium:deviceName'] = 'Android'
            
            console.log('✅ Set appium:udid to:', config.capabilities[0]['appium:udid'])
            console.log('✅ Set appium:deviceName to:', config.capabilities[0]['appium:deviceName'])
            console.log('Updated capabilities:', JSON.stringify(config.capabilities[0], null, 2))
        }
        try {
            const adbDevices = execSync('adb devices -l', { encoding: 'utf-8' })
            console.log('📱 ADB Devices at onPrepare:\n' + adbDevices)
        } catch (error: any) {
            console.log('❌ ADB Devices check failed:', error?.message || error)
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