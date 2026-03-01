import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

   async selectPoFromList(poNumber: string): Promise<void> {

    console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

    await this.ensureWebView(90000);

    const poCellSelector =
        `//*[@id="grid"]//ion-row/ion-col[4][contains(normalize-space(.),"${poNumber}")]`;

    let found = false;

    for (let attempt = 1; attempt <= 20; attempt++) {

        console.log(`\n🔄 Scroll Attempt ${attempt}/20`);

        // ✅ Horizontal scroll (important for CI WebView)
        await browser.execute(() => {
            const grid = document.querySelector('#grid');
            if (grid) {
                (grid as HTMLElement).scrollLeft = 2000;
            }
        });

        // ✅ Check if PO is visible
        const elements = await $$(poCellSelector);
        const count = await elements.length;

        console.log("Matching rows found:", count);

        if (count > 0) {
            found = true;
            break;
        }

        // ✅ Proper Ionic vertical scroll (Shadow DOM safe)
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

        await browser.pause(2500);
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