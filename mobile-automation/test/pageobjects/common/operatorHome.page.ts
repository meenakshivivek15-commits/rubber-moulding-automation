import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    get goodsReceiptTile() {
        // Adjust text if needed based on exact visible tile name
        return $('//*[contains(text(),"Gate Inward") or contains(text(),"Goods Receipt")]');
    }

    async openGoodsReceipt(): Promise<void> {

        console.log('\n===== OPENING GOODS RECEIPT =====\n');

        await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
        await browser.pause(3000);

        await this.switchToWebView();

        const tile = await this.goodsReceiptTile;

        await tile.waitForDisplayed({ timeout: 30000 });
        await tile.click();

        console.log('🟢 Goods Receipt tile clicked');

        await browser.waitUntil(async () => {
            const rows = await $$('ion-row').length;
            return rows > 0;
        }, {
            timeout: 30000,
            timeoutMsg: 'Goods Receipt list did not load'
        });

        console.log('✅ Goods Receipt List Loaded');
    }
}

export default new OperatorHomePage();