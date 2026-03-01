import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

        await this.ensureWebView(90000);

        const poCellSelector =
            `//*[@id="grid"]//ion-row/ion-col[4][contains(normalize-space(.),"${poNumber}")]`;

        let found = false;
        let previousRowCount = 0;

        for (let attempt = 1; attempt <= 15; attempt++) {

            console.log(`\n🔄 Scroll Attempt ${attempt}/15`);

            // 🔹 Always scroll horizontally first (CI issue)
            await browser.execute(() => {
                const grid = document.querySelector('#grid');
                if (grid) {
                    (grid as HTMLElement).scrollLeft = 2000;
                }
            });

            // 🔹 Check if PO exists
            const elements = await $$(poCellSelector);
            const count = await elements.length;
            console.log("Matching rows found:", count);

            if (count > 0) {
                found = true;
                break;
            }

            // 🔹 Get current row count in DOM
            const currentRowCount = await browser.execute(() => {
                return document.querySelectorAll('#grid ion-row').length;
            });

            console.log("Current DOM row count:", currentRowCount);

            // 🔹 If no new rows are loading → stop trying
            if (currentRowCount === previousRowCount) {
                console.log("⚠ No more rows loading. Stopping scroll.");
                break;
            }

            previousRowCount = currentRowCount;

            // 🔥 REAL SCROLL TRIGGER (important for Ionic)
            await browser.execute(() => {
                const rows = document.querySelectorAll('#grid ion-row');
                if (rows.length > 0) {
                    rows[rows.length - 1].scrollIntoView({ block: 'end' });
                }
            });

            await browser.pause(2000);
        }

        if (!found) {
            throw new Error(`PO ${poNumber} never appeared in Goods Receipt list`);
        }

        const poCell = await $(poCellSelector);

        await poCell.scrollIntoView();
        await browser.pause(500);

        try {
            await poCell.click();
        } catch {
            console.log("Normal click failed — using JS click");
            await browser.execute((el) => {
                (el as HTMLElement).click();
            }, poCell);
        }

        console.log(`🔥 PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();