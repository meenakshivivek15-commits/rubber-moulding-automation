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
 private async handleSystemPopupIfPresent(): Promise<void> {
    try {
        const closeApp = await $('id=android:id/aerr_close');
        const waitBtn = await $('id=android:id/aerr_wait');

        if (await closeApp.isDisplayed().catch(() => false)) {
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

 async openGoodsReceipt(): Promise<void> {

    console.log("\n===== OPENING GOODS RECEIPT MENU =====\n");

    const maxTotalMs = 240000;
    const startedAt = Date.now();
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt++) {
        if (Date.now() - startedAt > maxTotalMs) {
            throw new Error(`Timed out opening Goods Receipt after ${maxTotalMs}ms`);
        }

        try {
            await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
            await driver.pause(2000);

            await driver.pause(10000);

            await this.switchToNative().catch(() => undefined);

            await this.handleSystemPopupIfPresent().catch(() => undefined);

            const receiptTile = await $('id=com.ppaoperator.app:id/goods_receipt_icon');

            const source = await driver.getPageSource();
            console.log(source);

            await receiptTile.waitForDisplayed({ timeout: 60000 });

            try {
                await receiptTile.scrollIntoView();
            } catch {
            }

            try {
                await receiptTile.click();
            } catch {
                await driver.execute((el) => {
                    (el as HTMLElement).click();
                }, receiptTile);
            }

            const grid = await $('//*[@id="grid"]');
            await grid.waitForDisplayed({ timeout: 45000 });

            console.log('Goods Receipt list page loaded');
            return;
        } catch (error) {
            lastError = error;

            if (this.isSessionTerminatedError(error) || !driver.sessionId) {
                throw error instanceof Error ? error : new Error('Appium session terminated while opening Goods Receipt');
            }

            const message = error instanceof Error ? error.message : String(error);
            if (/WebView not available|No such context found|disconnected|Inspector\.detached|waitUntil condition timed out/i.test(message)) {
                console.log(`Recoverable WebView error while opening Goods Receipt (attempt ${attempt}), retrying...`);
                await this.switchToNative().catch(() => undefined);
                await driver.pause(1500);
                continue;
            }

            if (this.isAccessibilityHangError(error)) {
                console.log(`Recoverable Android accessibility timeout while opening Goods Receipt (attempt ${attempt}), retrying...`);
                await this.recoverFromUiHang(attempt);
                await this.switchToNative().catch(() => undefined);
                continue;
            }

            throw error;
        }
    }

    throw lastError instanceof Error ? lastError : new Error('Unable to open Goods Receipt after retries');
}
}
export default new OperatorHomePage();