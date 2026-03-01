import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

        await this.ensureWebView(90000);

        const poCellSelector =
            `//*[@id="grid"]//ion-row/ion-col[4][normalize-space()="${poNumber}"]`;

        let found = false;

        for (let attempt = 1; attempt <= 5; attempt++) {

            console.log(`\n🔄 Attempt ${attempt} to find PO...`);

            // Horizontal scroll (important in CI)
            await browser.execute(() => {
                const grid = document.querySelector('#grid');
                if (grid) {
                    (grid as HTMLElement).scrollLeft = 1500;
                }
            });

            const elements = await $$(poCellSelector);
            const count = await elements.length;

            console.log("Matching rows found:", count);

            if (count > 0) {
                found = true;
                break;
            }

            console.log("PO not found — refreshing via Operator Home...");

            // Navigate to Operator Home
            await browser.execute(() => {
                window.location.hash = '#/operatorhome';
            });

            await browser.pause(4000);

            // Reopen Goods Receipt
            await operatorHomePage.openGoodsReceipt();

            await this.ensureWebView(60000);
            await browser.pause(6000);
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