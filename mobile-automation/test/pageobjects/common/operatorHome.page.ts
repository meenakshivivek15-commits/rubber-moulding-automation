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
          '//*[contains(.,"Goods Receipt")]',
          '//ion-label[contains(.,"Goods Receipt")]'
     ];

      private async hasVisibleElement(selector: string): Promise<boolean> {
          try {
                const elements = await $$(selector);
                const element = elements[0];
                return Boolean(element && await element.isDisplayed().catch(() => false));
          } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.log(`Skipping selector probe due to lookup error: ${selector} :: ${message}`);
                return false;
          }
      }

     private async clickGoodsReceiptFromNativeHome(): Promise<boolean> {
        await this.switchToNative().catch(() => undefined);

        for (const selector of this.nativeGoodsReceiptSelectors) {
            const elements = await $$(selector);
            const element = elements[0];

            if (element && await element.isDisplayed().catch(() => false)) {
                await element.click();
                console.log(`Goods Receipt icon clicked in native context using: ${selector}`);
                return true;
            }
        }

        return false;
     }

     private async logOperatorHomeIndicators(): Promise<void> {
        const visibleIndicators: string[] = [];

        try {
            await this.switchToNative().catch(() => undefined);
            for (const selector of this.nativeGoodsReceiptSelectors) {
                if (await this.hasVisibleElement(selector)) {
                    visibleIndicators.push(`native:${selector}`);
                    break;
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.log(`Native indicator check failed (non-blocking): ${message}`);
        }

        try {
            await this.ensureWebView(20000).catch(() => undefined);
            for (const selector of this.webGoodsReceiptSelectors) {
                if (await this.hasVisibleElement(selector)) {
                    visibleIndicators.push(`web:${selector}`);
                    break;
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.log(`Web indicator check failed (non-blocking): ${message}`);
        }

        console.log(`Operator home menu indicators: ${visibleIndicators.join(' | ') || 'none found'}`);
     }

     private async clickGoodsReceiptFromWebHome(): Promise<boolean> {
        await this.ensureWebView(45000);

        for (const selector of this.webGoodsReceiptSelectors) {
            const elements = await $$(selector);
            const element = elements[0];

            if (element && await element.isDisplayed().catch(() => false)) {
                await element.click();
                console.log(`Goods Receipt icon clicked in web context using: ${selector}`);
                return true;
            }
        }

        return false;
     }

     private async waitForGoodsReceiptListLoaded(): Promise<void> {
          await this.ensureWebView(45000);
        const grid = await $('#grid');
        await grid.waitForDisplayed({ timeout: 30000 });
     }

     private isRecoverableWebviewError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
          return /Session ID is not set|NoSuchContextError|chromedriver|disconnected|no such window|No WEBVIEW found after wait|WEBVIEW context not available|instrumentation process is not running/i.test(message);
     }

   async openGoodsReceipt(): Promise<void> {

    console.log("\n===== OPENING GOODS RECEIPT MENU =====\n");

        const maxTotalMs = 150000;
        const startedAt = Date.now();

        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {
            if (Date.now() - startedAt > maxTotalMs) {
                throw new Error(`Timed out opening Goods Receipt after ${maxTotalMs}ms`);
            }

            try {
                await this.logOperatorHomeIndicators();

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