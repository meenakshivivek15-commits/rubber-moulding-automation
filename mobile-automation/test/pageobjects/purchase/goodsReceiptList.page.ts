import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

   async selectPoFromList(poNumber: string): Promise<void> {

    console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

    // ✅ Ensure WebView context
    await this.ensureWebView(90000);

    // ✅ FORCE REFRESH (Go back and reopen Goods Receipt)
    console.log("🔄 Refreshing Goods Receipt page...");

    try {
        const backBtn = await $('ion-back-button');
        if (await backBtn.isExisting()) {
            await backBtn.click();
            await browser.pause(2000);
        }
    } catch {}

    // Re-open Goods Receipt from operator home
    await operatorHomePage.openGoodsReceipt();
    await browser.pause(4000); // wait for API load

    // ✅ Wait until grid loads
    await browser.waitUntil(async () => {
        const rows = await $$('//*[@id="grid"]//ion-row');
        return rows.length > 0;
    }, {
        timeout: 30000,
        timeoutMsg: '❌ Goods Receipt grid did not load'
    });

    const poCellSelector =
        `//*[@id="grid"]//ion-row/ion-col[4][contains(normalize-space(.),"${poNumber}")]`;

    let found = false;
    const maxScrolls = 100;

    for (let attempt = 1; attempt <= maxScrolls; attempt++) {

        console.log(`🔄 Scroll Attempt ${attempt}/${maxScrolls}`);

        // ✅ Horizontal scroll (CI WebView fix)
        await browser.execute(() => {
            const grid = document.querySelector('#grid');
            if (grid) {
                (grid as HTMLElement).scrollLeft = 2000;
            }
        });

        const elements = await $$(poCellSelector);
        const count = await elements.length;

        console.log("Matching rows found:", count);

        if (count > 0) {
            found = true;
            break;
        }

        // ✅ Ionic vertical scroll (Shadow DOM safe)
        await browser.execute(() => {

            const ionContent = document.querySelector('ion-content');
            if (!ionContent) return;

            const scrollEl = (ionContent as any).shadowRoot
                ?.querySelector('.inner-scroll');

            if (scrollEl) {
                scrollEl.scrollBy({
                    top: scrollEl.clientHeight,
                    behavior: 'auto'
                });
            }
        });

        await browser.pause(1500);
    }

    if (!found) {
        throw new Error(`❌ PO ${poNumber} never appeared in Goods Receipt list`);
    }

    const poCell = await $(poCellSelector);

    await poCell.scrollIntoView();
    await browser.pause(500);

    try {
        await poCell.click();
    } catch {
        console.log("⚠ Normal click failed — using JS click");
        await browser.execute((el) => {
            (el as HTMLElement).click();
        }, poCell);
    }

    console.log(`🔥 PO ${poNumber} clicked successfully`);
}
}

export default new GoodsReceiptListPage();