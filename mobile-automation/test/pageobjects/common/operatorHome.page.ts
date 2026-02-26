import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

     private readonly nativeGoodsReceiptSelectors = [
        '//*[@text="Goods Receipt"]',
        '//*[contains(@text,"Goods Receipt")]',
        '//*[@content-desc="Goods Receipt"]',
        '//*[contains(@content-desc,"receipt")]'
     ];

     private readonly webGoodsReceiptSelectors = [
        '//ion-img[contains(@ng-reflect-src,"receipt")]',
        '//*[contains(text(),"Goods Receipt")]',
        '//ion-label[contains(normalize-space(),"Goods Receipt")]'
     ];

     private async clickGoodsReceiptFromNativeHome(): Promise<boolean> {
        await this.switchToNative().catch(() => undefined);

        for (const selector of this.nativeGoodsReceiptSelectors) {
            const element = await $(selector);
            if (await element.isDisplayed().catch(() => false)) {
                await element.click();
                console.log(`Goods Receipt icon clicked in native context using: ${selector}`);
                return true;
            }
        }

        return false;
     }

     private async clickGoodsReceiptFromWebHome(): Promise<boolean> {
        await this.ensureWebView(90000);

        for (const selector of this.webGoodsReceiptSelectors) {
            const element = await $(selector);
            if (await element.isDisplayed().catch(() => false)) {
                await element.click();
                console.log(`Goods Receipt icon clicked in web context using: ${selector}`);
                return true;
            }
        }

        return false;
     }

     private async waitForGoodsReceiptListLoaded(): Promise<void> {
        await this.ensureWebView(90000);
        const grid = await $('#grid');
        await grid.waitForDisplayed({ timeout: 30000 });
     }

     private isRecoverableWebviewError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
          return /Session ID is not set|NoSuchContextError|chromedriver|disconnected|no such window|No WEBVIEW found after wait|WEBVIEW context not available|instrumentation process is not running/i.test(message);
     }

   async openGoodsReceipt(): Promise<void> {

    console.log("\n===== OPENING GOODS RECEIPT MENU =====\n");

        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const clickedFromNative = await this.clickGoodsReceiptFromNativeHome();
                if (!clickedFromNative) {
                    const clickedFromWeb = await this.clickGoodsReceiptFromWebHome();
                    if (!clickedFromWeb) {
                        throw new Error('Goods Receipt icon not found on Operator home screen');
                    }
                }

                await this.waitForGoodsReceiptListLoaded();

                console.log("Goods Receipt list page loaded successfully");
                return;
            } catch (error) {
                lastError = error;

                if (attempt < 3 && this.isRecoverableWebviewError(error)) {
                    console.log(`Recoverable WebView error while opening Goods Receipt (attempt ${attempt}), retrying...`);

                    const message = error instanceof Error ? error.message : String(error);
                    if (/instrumentation process is not running/i.test(message)) {
                        console.log('UiAutomator2 instrumentation crashed, re-activating app before retry...');
                        await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
                        await driver.pause(4000);
                    }

                    await this.switchToNative().catch(() => undefined);
                    await driver.pause(2000);
                    continue;
                }

                throw error;
            }
        }

        throw lastError instanceof Error
            ? lastError
            : new Error('Unable to open Goods Receipt after retries');
}
}

export default new OperatorHomePage();