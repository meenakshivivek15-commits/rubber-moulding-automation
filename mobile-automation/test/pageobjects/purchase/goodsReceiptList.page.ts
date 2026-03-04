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

    console.log("\n========== SELECTING FIRST AVAILABLE PO ==========\n");

    // Scroll page to trigger data load
    const content = await $('ion-content');

    await browser.execute((el) => {
        el.scrollTo(0, 0);
    }, content);

    await browser.pause(2000);

    // Wait until PO rows appear
    await browser.waitUntil(async () => {
        const rows = await $$('ion-row');
        const rowcount = await rows.length;
        console.log("PO row count:", rowcount);
        return rowcount > 1;
    }, {
        timeout: 20000,
        timeoutMsg: "PO list did not load"
    });

    const rows = await $$('ion-row');

    console.log("PO rows detected:", rows.length);

    const firstRow = rows[1]; // skip header

    const poText = await firstRow.getText();

    console.log("Selected PO:", poText);

    await firstRow.click();

    return poText;
}
}

export default new GoodsReceiptListPage();