import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    private readonly goodsReceiptTileSelector =
        '//*[@id="main"]/app-home/ion-content[2]/ion-grid/ion-row/div[23]/ion-col/ion-img';

    private async clickGoodsReceiptFromNativeHome(): Promise<void> {
        const receiptTile = await $(this.goodsReceiptTileSelector);

        await receiptTile.waitForDisplayed({ timeout: 45000 });

        try {
            await receiptTile.scrollIntoView();
        } catch {
        }

        await receiptTile.click();

        console.log('✅ Goods Receipt icon clicked successfully');
    }

    private async waitForGoodsReceiptListLoaded(): Promise<void> {
        const grid = await $('#grid');
        await grid.waitForDisplayed({ timeout: 45000 });

        console.log('✅ Goods Receipt list page loaded');
    }

    async openGoodsReceipt(): Promise<void> {

        console.log('\n===== OPENING GOODS RECEIPT MENU =====\n');

        const maxTotalMs = 120000;
        const startedAt = Date.now();

        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {

            if (Date.now() - startedAt > maxTotalMs) {
                throw new Error(`Timed out opening Goods Receipt after ${maxTotalMs}ms`);
            }

            try {
                await this.switchToNative().catch(() => undefined);

                await this.clickGoodsReceiptFromNativeHome();
                await this.waitForGoodsReceiptListLoaded();

                console.log('🎉 Goods Receipt opened successfully');
                return;

            } catch (error) {

                lastError = error;

                if (!driver.sessionId) {
                    throw new Error('Appium session terminated while opening Goods Receipt');
                }

                console.log(`Retrying openGoodsReceipt (attempt ${attempt})...`);

                await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
                await driver.pause(3000);
            }
        }

        throw lastError instanceof Error
            ? lastError
            : new Error('Unable to open Goods Receipt after retries');
    }
}

export default new OperatorHomePage();