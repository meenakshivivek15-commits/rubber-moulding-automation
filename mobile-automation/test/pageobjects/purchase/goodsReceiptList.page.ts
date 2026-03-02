import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

  async selectPoFromList(poNumber: string): Promise<void> {

    console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

    await this.ensureWebView(90000);

    // ✅ Wait for page container first
    await browser.waitUntil(async () => {
        const ionContent = await $('ion-content');
        return await ionContent.isExisting();
    }, {
        timeout: 20000,
        timeoutMsg: '❌ ion-content not loaded'
    });

    // ✅ Wait for grid element itself
    await browser.waitUntil(async () => {
        const grid = await $('#grid');
        return await grid.isExisting();
    }, {
        timeout: 30000,
        timeoutMsg: '❌ Grid container not found'
    });

    // ✅ Wait until at least 1 row appears
    await browser.waitUntil(async () => {
        const rows = await $$('//*[@id="grid"]//ion-row');
        const count = await rows.length;
        console.log("Current row count:", count);
        return count > 0;
    }, {
        timeout: 40000,
        timeoutMsg: '❌ Goods Receipt grid did not load'
    });

    const poCellSelector =
        `//*[@id="grid"]//ion-row/ion-col[4][contains(normalize-space(.),"${poNumber}")]`;

    let found = false;
    const maxScrolls = 50; // 100 not needed now

    for (let attempt = 1; attempt <= maxScrolls; attempt++) {

        console.log(`🔄 Scroll Attempt ${attempt}/${maxScrolls}`);

        const elements = await $$(poCellSelector);
        const count = await elements.length;

        if (count > 0) {
            found = true;
            break;
        }

        // Ionic vertical scroll
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

        await browser.pause(1200);
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
        await browser.execute((el) => {
            (el as HTMLElement).click();
        }, poCell);
    }

    console.log(`🔥 PO ${poNumber} clicked successfully`);
}
}

export default new GoodsReceiptListPage();