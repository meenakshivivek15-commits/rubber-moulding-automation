import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);
        const maxTotalMs = 150000;
        const startedAt = Date.now();

        // 1️⃣ Ensure WEBVIEW with bounded wait
        await this.ensureWebView(90000);

        // 2️⃣ Dynamic PO selector (4th column)
        const poCellSelector =
            `//*[@id="grid"]//ion-row/ion-col[4][normalize-space()="${poNumber}"]`;

        let found = false;
        let lastKnownContexts: string[] = [];

        // 3️⃣ Retry Navigation Logic
        for (let attempt = 1; attempt <= 3; attempt++) {
            if (Date.now() - startedAt > maxTotalMs) {
                throw new Error(`Timed out searching PO ${poNumber} in Goods Receipt list after ${maxTotalMs}ms`);
            }

            console.log(`\n🔄 Attempt ${attempt} to find PO...`);

            lastKnownContexts = await driver.getContexts() as string[];

            const elements = await $$(poCellSelector);
            const count = await elements.length;

            console.log("Matching rows found:", count);

            if (count > 0) {
                found = true;
                break;
            }

            console.log("PO not found — navigating to Operator Home...");

            // Force navigate to Operator Home
            await driver.execute(() => {
                window.location.hash = '#/operatorhome';  // adjust if needed
            });

            await driver.pause(4000);

            // Reopen Goods Receipt
            await operatorHomePage.openGoodsReceipt();
            await this.ensureWebView(60000);
            await driver.pause(3000);
        }

        if (!found) {
            throw new Error(`PO ${poNumber} never appeared in Goods Receipt list. Contexts: ${lastKnownContexts.join(', ') || 'none'}`);
        }

        // 4️⃣ Click the PO safely
        const poCell = await $(poCellSelector);

        await poCell.scrollIntoView();
        await driver.pause(500);

        try {
            await poCell.click();
        } catch {
            console.log("Normal click failed — using JS click");
            await driver.execute((el) => {
                (el as HTMLElement).click();
            }, poCell);
        }

        console.log(`🔥 PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();