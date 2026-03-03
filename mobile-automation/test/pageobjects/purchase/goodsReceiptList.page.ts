import BasePage from '../base.page';

class GoodsReceiptListPage extends BasePage {

    private async getGridData(): Promise<string[]> {

        const rows = await $$('ion-row').length;

        const poList: string[] = [];

        for (let i = 1; i < rows; i++) { // skip header
            const text = (await rows[i].getText()).trim();
            if (text) {
                poList.push(text.toUpperCase());
            }
        }

        return poList;
    }

    private async clickPo(poValue: string): Promise<boolean> {

        const normalizedPo = poValue.trim().toUpperCase();
        const rows = await $$('ion-row');

        for (const row of rows) {

            const text = (await row.getText()).trim().toUpperCase();

            if (text.includes(normalizedPo)) {

                await row.scrollIntoView();
                await row.waitForDisplayed({ timeout: 10000 });
                await row.click();

                console.log(`🟢 WebDriver click performed on PO: ${normalizedPo}`);
                return true;
            }
        }

        return false;
    }

    async selectFirstAvailablePo(): Promise<string> {

        console.log('\n========== SELECTING FIRST AVAILABLE PO ==========\n');

        await this.switchToWebView();

        await browser.waitUntil(async () => {
            const rows = await $$('ion-row').length;
            return rows > 1;
        }, {
            timeout: 60000,
            timeoutMsg: 'No POs available in Goods Receipt'
        });

        const poList = await this.getGridData();

        if (poList.length === 0) {
            throw new Error('No POs available in Goods Receipt');
        }

        const selectedPo = poList[0];

        console.log(`Using dynamic PO: ${selectedPo}`);

        const clicked = await this.clickPo(selectedPo);

        if (!clicked) {
            throw new Error(`Failed to click PO ${selectedPo}`);
        }

        console.log(`✅ PO ${selectedPo} clicked successfully`);

        return selectedPo;
    }
}

export default new GoodsReceiptListPage();