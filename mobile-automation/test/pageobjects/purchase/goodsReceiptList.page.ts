import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    private getPoCellSelector(poNumber: string): string {
        return `//*[@id="grid"]//ion-row/ion-col[4][normalize-space()="${poNumber}"]`;
    }

    private async getVisiblePoNumbers(): Promise<string[]> {
        const poCells = await $$('#grid ion-row ion-col:nth-child(4)');
        const values: string[] = [];

        for (const cell of poCells) {
            const text = (await cell.getText().catch(() => '')).trim();
            if (text) {
                values.push(text);
            }
        }

        return values;
    }

    private async refreshGoodsReceiptListPage(): Promise<void> {
        console.log('Refreshing Goods Receipt list page...');

        try {
            await browser.refresh();
        } catch {
            await driver.execute(() => {
                window.location.reload();
            });
        }

        await driver.pause(3000);
        const grid = await $('#grid');
        await grid.waitForDisplayed({ timeout: 20000 });
    }

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

        // 1️⃣ Ensure WEBVIEW
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
        const poCellSelector = this.getPoCellSelector(poNumber);

        let found = false;

        // 3️⃣ Retry/Refresh Logic
        for (let attempt = 1; attempt <= 10; attempt++) {

            console.log(`\n🔄 Attempt ${attempt} to find PO...`);

            let count = 0;
            for (let poll = 1; poll <= 5; poll++) {
                const elements = await $$(poCellSelector);
                count = await elements.length;

                if (count > 0) {
                    break;
                }

                await driver.pause(2000);
            }

            console.log("Matching rows found:", count);

            if (count > 0) {
                found = true;
                break;
            }

            const visiblePoNumbers = await this.getVisiblePoNumbers();
            console.log(`Visible PO values: ${visiblePoNumbers.join(', ') || 'none'}`);

            try {
                await this.refreshGoodsReceiptListPage();
            } catch {
                console.log('Refresh failed — reopening Goods Receipt from home...');
                await operatorHomePage.openGoodsReceipt();
                await driver.pause(6000);
            }
        }

        if (!found) {
            const visiblePoNumbers = await this.getVisiblePoNumbers();
            throw new Error(`PO ${poNumber} never appeared in Goods Receipt list. Visible PO values: ${visiblePoNumbers.join(', ') || 'none'}`);
        }

        // 4️⃣ Click the PO safely
        const poCell = await $(poCellSelector);

        await poCell.scrollIntoView();
        await poCell.waitForDisplayed({ timeout: 10000 });
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