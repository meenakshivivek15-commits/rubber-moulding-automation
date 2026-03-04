import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

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

 async selectPoFromList(poNumber: string): Promise<void> {

    console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

    await this.ensureWebView(90000);

    const poSelector = `//ion-text[contains(normalize-space(),"${poNumber}")]`;

    let found = false;

    for (let attempt = 1; attempt <= 5; attempt++) {

        console.log(`🔄 Attempt ${attempt} to find PO`);

        // reveal Purchase ID column
        await this.scrollGrid("left");

        await browser.pause(1500);

        const elements = await $$(poSelector);
        const count = await elements.length;

        console.log(`Matching PO elements: ${count}`);

        if (count > 0) {

            const poElement = elements[0];

            await poElement.waitForDisplayed({ timeout: 10000 });

            console.log(`✅ PO found: ${poNumber}`);

            await this.safeClick(poElement);

            found = true;
            break;
        }

        console.log("PO not found — refreshing GoodsReceipt page");

        // go back to Operator Home
        await driver.back();

        await browser.pause(2000);

        // reopen GoodsReceipt
        await operatorHomePage.clickTile("GoodsReceipt");

        await browser.pause(5000);
    }

    if (!found) {
        throw new Error(`❌ PO ${poNumber} not found after refreshing GoodsReceipt`);
    }
}
}


export default new GoodsReceiptListPage();