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

 private async waitForGoodsReceiptTile(timeoutMs: number, attempt: number): Promise<any> {
    const startedAt = Date.now();
    let lastError: unknown;

    while (Date.now() - startedAt < timeoutMs) {
        try {
            const source = await driver.getPageSource();

            if (source.includes('android:id/aerr_close') || source.includes("isn't responding")) {
                await this.handleSystemPopupIfPresent(attempt).catch(() => undefined);
                await driver.pause(1200);
                continue;
            }

            if (!source.includes('goods_receipt_icon')) {
                await driver.pause(1200);
                continue;
            }

            const tile = await $('id=com.ppaoperator.app:id/goods_receipt_icon');
            await tile.waitForDisplayed({ timeout: 8000 });
            return tile;
        } catch (error) {
            lastError = error;

            if (this.isAccessibilityHangError(error)) {
                console.log('Accessibility hang while probing Goods Receipt tile, recovering...');
                await this.recoverFromUiHang(attempt);
                await this.switchToNative().catch(() => undefined);
                continue;
            }

            await driver.pause(1000);
        }
    }

    throw lastError instanceof Error ? lastError : new Error('Goods Receipt tile not available before timeout');
 }

 private async tryOpenGoodsReceiptViaWebRoute(): Promise<boolean> {
    try {
        const contexts = await driver.getContexts() as string[];
        console.log('Available contexts before Goods Receipt route switch:', contexts);

        const webview = contexts.find((context) => String(context).includes('WEBVIEW'));
        if (!webview) {
            return false;
        }

        await driver.switchContext(webview);

        const routes = ['#/goodsreceiptlist', '#/goodsreceipt', '#/goods-receipt', '#/goods-receipt-list'];
        for (let cycle = 1; cycle <= 3; cycle++) {
            for (const route of routes) {
                await driver.execute((targetRoute) => {
                    window.location.hash = targetRoute as string;
                }, route).catch(() => undefined);

                await driver.pause(3000);

                const grid = await $('#grid');
                if (await grid.isDisplayed().catch(() => false)) {
                    console.log(`Opened Goods Receipt via WebView route fallback: ${route} (cycle ${cycle})`);
                    return true;
                }

                const poInput = await $('input[type="text"]');
                if (await poInput.isDisplayed().catch(() => false)) {
                    console.log(`Opened Goods Receipt form via WebView route fallback: ${route} (cycle ${cycle})`);
                    return true;
                }

                const refreshButton = await $('button[aria-label="refresh"], ion-icon[name="refresh"], [name="refresh"], [aria-label*="refresh" i]');
                if (await refreshButton.isDisplayed().catch(() => false)) {
                    await refreshButton.click().catch(() => undefined);
                    await driver.pause(1200);
                }
            }

            await driver.pause(1500);
        }
    } catch {
    }

    return false;
 }

 private async relaunchOperatorApp(): Promise<void> {
     await driver.terminateApp('com.ppaoperator.app').catch(() => undefined);
     await driver.pause(1200);
     await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
     await driver.pause(3500);
 }

 async openGoodsReceipt(): Promise<void> {

    console.log("\n===== OPENING GOODS RECEIPT MENU =====\n");

    const maxTotalMs = 300000;
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

            const contexts = await driver.getContexts() as string[];
            console.log('Available contexts while opening Goods Receipt:', contexts);

            const webview = contexts.find((context) => String(context).includes('WEBVIEW'));
            if (webview) {
                await driver.switchContext(webview).catch(() => undefined);
            }

            const openedViaRouteFirst = await this.tryOpenGoodsReceiptViaWebRoute();
            if (openedViaRouteFirst) {
                console.log('Goods Receipt page loaded via primary WebView route strategy');
                return;
            }

            await this.switchToNative().catch(() => undefined);

            await this.handleSystemPopupIfPresent(attempt).catch(() => undefined);

            let receiptTile: any;
            try {
                receiptTile = await this.waitForGoodsReceiptTile(60000, attempt);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (/Goods Receipt tile not available before timeout/i.test(message)) {
                    const openedViaRoute = await this.tryOpenGoodsReceiptViaWebRoute();
                    if (openedViaRoute) {
                        console.log('Goods Receipt list page loaded via WebView route fallback');
                        return;
                    }

                    throw new Error('Goods Receipt tile not available before timeout (route fallback unavailable)');
                }
                throw error;
            }

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
                await this.relaunchOperatorApp();
                continue;
            }

            if (/Goods Receipt tile not available before timeout/i.test(message)) {
                console.log(`Goods Receipt entry not available yet (attempt ${attempt}), relaunching app and retrying...`);
                await this.switchToNative().catch(() => undefined);
                await this.relaunchOperatorApp();
                continue;
            }

            if (this.isAccessibilityHangError(error)) {
                console.log(`Recoverable Android accessibility timeout while opening Goods Receipt (attempt ${attempt}), retrying...`);
                await this.recoverFromUiHang(attempt);
                await this.switchToNative().catch(() => undefined);
                await this.relaunchOperatorApp();
                continue;
            }

            throw error;
        }
    }

    throw lastError instanceof Error ? lastError : new Error('Unable to open Goods Receipt after retries');
}
}
export default new OperatorHomePage();