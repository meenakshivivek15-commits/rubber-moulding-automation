import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

     private isRecoverableWebviewError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        return /Session ID is not set|NoSuchContextError|chromedriver|disconnected|no such window/i.test(message);
     }

   async openGoodsReceipt(): Promise<void> {

    console.log("\n===== OPENING GOODS RECEIPT MENU =====\n");

        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await this.ensureWebView(90000);

                const receiptTile = await $('//ion-img[contains(@ng-reflect-src,"receipt")]');
                await receiptTile.waitForDisplayed({ timeout: 30000 });
                await receiptTile.click();

                const grid = await $('#grid');
                await grid.waitForDisplayed({ timeout: 30000 });

                console.log("Goods Receipt list page loaded successfully");
                return;
            } catch (error) {
                lastError = error;

                if (attempt < 3 && this.isRecoverableWebviewError(error)) {
                    console.log(`Recoverable WebView error while opening Goods Receipt (attempt ${attempt}), retrying...`);
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