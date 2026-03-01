import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

        // 1️⃣ Ensure WEBVIEW context
        const currentContext = String(await driver.getContext());

        if (!currentContext.includes('WEBVIEW')) {
            const contexts = await driver.getContexts() as string[];
            const webview = contexts.find(ctx => ctx.startsWith('WEBVIEW_'));

            if (!webview) {
                throw new Error('WEBVIEW context not found');
            }

            await driver.switchContext(webview);
        }

        // 2️⃣ Dynamic PO selector (4th column)
        const poCellSelector =
            `//*[@id="grid"]//ion-row/ion-col[4][normalize-space()="${poNumber}"]`;

        let found = false;

        // 3️⃣ Retry logic (refresh style)
        for (let attempt = 1; attempt <= 5; attempt++) {

            console.log(`\n🔄 Attempt ${attempt} to find PO...`);

            // horizontal scroll (column 4 visibility)
            await browser.execute(() => {
                const grid = document.querySelector('#grid');
                if (grid) {
                    grid.scrollLeft = 1000;
                }
            });

            const elements = await $$(poCellSelector);
            const count = await elements.length;

            console.log("Matching rows found:", count);

            if (count > 0) {
                found = true;
                break;
            }

            console.log("PO not found — refreshing Goods Receipt page...");

            // Go back to Operator Home
            await driver.execute(() => {
                window.location.hash = '#/operatorhome';
            });

            await browser.pause(5000);

            // Reopen Goods Receipt
            await operatorHomePage.openGoodsReceipt();

            await browser.pause(8000); // give backend time in CI
        }

        if (!found) {
            throw new Error(`PO ${poNumber} never appeared in Goods Receipt list`);
        }

        // 4️⃣ Click safely
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