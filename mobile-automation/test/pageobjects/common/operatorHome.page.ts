import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    // ===============================
    // 🔎 Locator
    // ===============================
    /*get goodsReceiptIcon() {
        // More stable than absolute XPath
        return $('//ion-img[contains(@ng-reflect-src,"receipt")]');
    }*/


    // ===============================
    // 🚀 Action
    // ===============================
 private async handleSystemPopupIfPresent(attempt: number): Promise<void> {
    try {
        const closeApp = await $('id=android:id/aerr_close');
        const waitBtn = await $('id=android:id/aerr_wait');
        const alertTitle = await $('id=android:id/alertTitle');

        if (await closeApp.isDisplayed().catch(() => false)) {
            const titleText = await alertTitle.getText().catch(() => '');
            const criticalAnr = /Process system isn't responding|Appium Settings isn't responding/i.test(titleText);

            if (criticalAnr) {
                console.log(`⚠ Critical ANR detected (${titleText}) - clicking Close app and recovering`);
                await closeApp.click().catch(() => undefined);
                await driver.pause(1200);
                await this.recoverFromUiHang(attempt);
                return;
            }

            console.log('⚠ ANR popup detected - clicking Wait');
            await waitBtn.click().catch(() => undefined);
            await driver.pause(1000);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/AccessibilityNodeInfo|active window|Timed out/i.test(message)) {
            console.log('⚠ Skipping ANR popup probe due to temporary UI accessibility timeout');
            return;
        }

        console.log(`⚠ ANR popup probe failed, continuing: ${message}`);
    }
 }

 private isAccessibilityHangError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /AccessibilityNodeInfo|active window|hogging the main UI thread|Timed out after\s*\d+ms waiting for the root/i.test(message);
 }

 private async recoverFromUiHang(attempt: number): Promise<void> {
    console.log(`Recovering from Android UI hang (attempt ${attempt})...`);
    await driver.execute('mobile: shell', { command: 'input', args: ['keyevent', '3'] }).catch(() => undefined);
    await driver.pause(1500);
    await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
    await driver.pause(3000);

    const currentPackage = await driver.execute('mobile: getCurrentPackage', {}).catch(() => 'unknown');
    if (String(currentPackage) !== 'com.ppaoperator.app') {
        await driver.execute('mobile: startActivity', {
            intent: 'com.ppaoperator.app/com.example.app.MainActivity'
        }).catch(() => undefined);
        await driver.pause(2500);
    }
 }

 
 private async relaunchOperatorApp(): Promise<void> {
     await driver.terminateApp('com.ppaoperator.app').catch(() => undefined);
     await driver.pause(1200);
     await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
     await driver.pause(3500);
 }

 async openGoodsReceipt(): Promise<void> {

    console.log('\n===== OPENING GOODS RECEIPT =====\n');

    // Ensure operator app is foreground
    await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
    await driver.pause(4000);

    // 1️⃣ Get contexts
    const contexts = await driver.getContexts() as string[];
    console.log('Available contexts:', contexts);

    const webview = contexts.find(c => c.includes('WEBVIEW'));
    if (!webview) {
        throw new Error('WEBVIEW context not found');
    }

    // 2️⃣ Switch to WebView
    await driver.switchContext(webview);
    console.log('🔵 Switched to WEBVIEW:', webview);

const currentUrl = await browser.getUrl().catch(() => 'URL not available');
console.log('🔵 Current URL BEFORE navigation:', currentUrl);

const currentHash = await browser.execute(() => window.location.hash).catch(() => 'hash error');
console.log('🔵 Current hash BEFORE navigation:', currentHash);

const title = await browser.getTitle().catch(() => 'no title');
console.log('🔵 Page title BEFORE navigation:', title);

    // 3️⃣ Navigate via Ionic route
    await browser.execute((route) => {
        window.location.hash = route;
    }, '#/goodsreceiptlist');

    await browser.pause(2000);

const newHash = await browser.execute(() => window.location.hash).catch(() => 'hash error');
console.log('🟢 Hash AFTER navigation:', newHash);

const newUrl = await browser.getUrl().catch(() => 'URL not available');
console.log('🟢 URL AFTER navigation:', newUrl);

const bodyPreview = await browser.execute(() => {
    return document.body.innerHTML.slice(0, 800);
}).catch(() => 'DOM read failed');

console.log('🟢 DOM PREVIEW AFTER NAVIGATION:\n', bodyPreview);

    // 4️⃣ Wait for Ionic page to fully render
    await browser.waitUntil(
    async () => {
        const exists = await browser.execute(() => {
            return document.querySelector('ion-content') !== null;
        });

        console.log('🟡 ion-content exists:', exists);
        return Boolean(exists);
    },
    {
        timeout: 20000,
        timeoutMsg: 'Goods Receipt page did not render'
    }

    );

    // 5️⃣ Wait for actual list element (NOT #grid)
    const list = await $('ion-list, ion-grid, ion-content');
    await list.waitForDisplayed({ timeout: 20000 });

    console.log('✅ Goods Receipt page loaded');
}
}
export default new OperatorHomePage();