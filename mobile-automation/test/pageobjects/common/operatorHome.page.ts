import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    private readonly goodsReceiptTileSelector = '//*[@id="main"]/app-home/ion-content[2]/ion-grid/ion-row/div[23]/ion-col/ion-img';

    private async clickGoodsReceiptFromWebHome(): Promise<void> {
        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await this.ensureWebView(120000);

                const receiptTile = await $(this.goodsReceiptTileSelector);
                await receiptTile.waitForDisplayed({ timeout: 45000 });

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

                console.log(`Goods Receipt icon clicked using fixed locator: ${this.goodsReceiptTileSelector}`);
                return;
            } catch (error) {
                lastError = error;
                const message = error instanceof Error ? error.message : String(error);

                if (this.isSessionTerminatedError(error) || !driver.sessionId) {
                    throw error instanceof Error ? error : new Error('Appium session terminated while opening Goods Receipt');
                }

                if (/Session ID is not set|disconnected|No such context found|no such window/i.test(message)) {
                    await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
                    await driver.pause(3000);
                    await this.switchToNative().catch(() => undefined);
                    await driver.pause(2000);
                    continue;
                }

                throw error;
            }
        }

        throw lastError instanceof Error ? lastError : new Error('Unable to click Goods Receipt tile from web home');
    }

      private async waitForGoodsReceiptListLoaded(): Promise<void> {
             await this.ensureWebView(90000);
        const grid = await $('#grid');
          await grid.waitForDisplayed({ timeout: 45000 });
     }

     private isRecoverableWebviewError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
          return /Session ID is not set|NoSuchContextError|No such context found|chromedriver|disconnected|no such window|No WEBVIEW found after wait|WEBVIEW context not available|WEBVIEW context not stable|instrumentation process is not running/i.test(message);
     }

   async openGoodsReceipt(): Promise<void> {

    console.log("\n===== OPENING GOODS RECEIPT MENU =====\n");

        const maxTotalMs = 180000;
        const startedAt = Date.now();

        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {
            if (Date.now() - startedAt > maxTotalMs) {
                throw new Error(`Timed out opening Goods Receipt after ${maxTotalMs}ms`);
            }

            try {
                await this.clickGoodsReceiptFromWebHome();

                await this.waitForGoodsReceiptListLoaded();

                console.log("Goods Receipt list page loaded successfully");
                return;
            } catch (error) {
                lastError = error;

                if (this.isSessionTerminatedError(error) || !driver.sessionId) {
                    throw error instanceof Error ? error : new Error('Appium session terminated while opening Goods Receipt');
                }

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