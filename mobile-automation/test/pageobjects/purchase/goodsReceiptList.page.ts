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

    console.log("\n========= SELECTING FIRST AVAILABLE PO =========\n");

    await this.ensureWebView(90000);

     // 👉 Add refresh here
    await browser.pause(2000);
    await driver.execute('mobile: swipe', { direction: 'down' });

    // Wait until PO list loads
    await browser.waitUntil(async () => {
        const pos = await $$('//ion-text[contains(text(),"FP") or contains(text(),"JP") or contains(text(),"KP")]');
        const poscount = await pos.length;
        console.log("PO count:", poscount);

    }, {
        timeout: 20000,
        timeoutMsg: "PO list did not load"
    });

    const poList = await $$('//ion-text[contains(text(),"FP") or contains(text(),"JP") or contains(text(),"KP")]');

    console.log("PO rows detected:", poList.length);

    const firstPo = poList[0];

    const poNumber = await firstPo.getText();

    console.log("Selected PO:", poNumber);

    await firstPo.click();

    return poNumber;
}
}

export default new GoodsReceiptListPage();