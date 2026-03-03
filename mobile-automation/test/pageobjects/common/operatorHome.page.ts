import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    get goodsReceiptIcon() {
        return $('#main > app-home > ion-content:nth-child(3) > ion-grid > ion-row > div:nth-child(23) > ion-col > ion-img');
    }

    async openGoodsReceipt(): Promise<void> {

        console.log('\n===== OPENING GOODS RECEIPT =====\n');

        await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
        await browser.pause(5000);

        await this.switchToWebView();

        const icon = await this.goodsReceiptIcon;

        await icon.waitForDisplayed({ timeout: 30000 });
        await icon.scrollIntoView();
        await icon.click();

        console.log('🟢 Goods Receipt icon clicked');

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