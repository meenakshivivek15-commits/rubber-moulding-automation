import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

        await this.ensureWebView(90000);

        const poUpper = poNumber.toUpperCase();

        // ✅ Keep 4th column
        // ✅ But match ANY nested text inside it
        const poCellSelector = `
            //*[@id="grid"]//ion-row/ion-col[4]//*[contains(
                translate(normalize-space(.),
                'abcdefghijklmnopqrstuvwxyz',
                'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                "${poUpper}"
            )]
        `;

        await browser.waitUntil(
            async () => {

                // 🔁 Horizontal scroll attempt (important for CI)
                await browser.execute(() => {
                    const grid = document.querySelector('#grid');
                    if (grid) {
                        grid.scrollLeft = 1000;
                    }
                });

                const elements = await $$(poCellSelector);
                const count =await elements.length;

                console.log('Matching rows found:', count);

                return count > 0;
            },
            {
                timeout: 60000,
                interval: 3000,
                timeoutMsg: `PO ${poNumber} did not appear in Goods Receipt list`
            }
        );

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