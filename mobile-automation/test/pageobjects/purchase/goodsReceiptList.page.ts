import { count } from 'node:console';
import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    private async getGridData(): Promise<string[]> {

        const rows = await $$('ion-row');
        const rowCount = await rows.length;
        const poList: string[] = [];

        for (let i = 1; i < rowCount; i++) { // skip header

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

                await this.safeClick(row);

                console.log(`🟢 WebDriver click performed on PO: ${normalizedPo}`);
                return true;
            }
        }

        return false;
    }

    async selectPoFromList(poNumber: string): Promise<void> {

    console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

    await this.ensureWebView(90000);

    // reveal Purchase ID column
    await this.scrollGrid("left");

    const maxScrollAttempts = 30;

    for (let attempt = 1; attempt <= maxScrollAttempts; attempt++) {

        console.log(`🔎 Scan attempt ${attempt}`);

        const rows = await $$('ion-row');
        const rowcount = await rows.length;

        console.log(`Found ${rowcount} rows`);
        for (let i = 1; i < rowcount; i++) {

            const poCell = await rows[i].$('ion-col:nth-child(4)');

            const poText = (await poCell.getText()).trim();

            console.log(`Row ${i} PO: ${poText}`);

            if (poText === poNumber) {

                console.log(`✅ PO found: ${poNumber}`);

                await rows[i].scrollIntoView();

                await this.safeClick(rows[i]);

                return;
            }
        }

        console.log("⬇️ PO not found — scrolling down");

        await this.scrollRow();
    }

    throw new Error(`❌ PO ${poNumber} not found after scrolling list`);
}
}

export default new GoodsReceiptListPage();