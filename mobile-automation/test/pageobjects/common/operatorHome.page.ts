import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    get goodsReceiptIcon() {
        return $('#main > app-home > ion-content:nth-child(3) > ion-grid > ion-row > div:nth-child(23) > ion-col > ion-img');
    }

    async openGoodsReceipt(): Promise<void> {

    console.log('\n===== OPENING GOODS RECEIPT =====\n');

    await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
    await browser.pause(4000);

    await this.switchToWebView();

    const clicked = await browser.execute(() => {

        const texts = Array.from(document.querySelectorAll('ion-text'));

        for (const textEl of texts) {

            const shadow = (textEl as any).shadowRoot;
            if (!shadow) continue;

            const label = shadow.textContent?.trim() || '';

            if (label === 'GoodsReceipt') {

                const col = textEl.closest('ion-col');
                if (!col) return false;

                const img = col.querySelector('ion-img');
                if (!img) return false;

                (img as HTMLElement).click();
                return true;
            }
        }

        return false;
    });

    if (!clicked) {
        throw new Error('GoodsReceipt tile not found');
    }

    console.log('🟢 GoodsReceipt icon clicked');

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