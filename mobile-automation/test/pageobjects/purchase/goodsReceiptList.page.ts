import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

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
        console.log("Switched to:", webview);
    }

    const poCellSelector =
        `//*[@id="grid"]//ion-row/ion-col[4][normalize-space()="${poNumber}"]`;

    let found = false;
    let previousRowCount = 0;

    for (let attempt = 1; attempt <= 20; attempt++) {

        console.log(`\n🔄 Scroll Attempt ${attempt}`);

        // Check if PO already visible
        const elements = await $$(poCellSelector);
        const count = await elements.length;

        console.log("Matching rows found:", count);

        if (count > 0) {
            found = true;
            break;
        }

        // Count current rows
        const allRows = await $$('//*[@id="grid"]//ion-row');
        const currentRowCount = await allRows.length;

        console.log("Current row count:", currentRowCount);

        // If no new rows loaded after last scroll → stop
        if (currentRowCount === previousRowCount) {
            console.log("No more rows loading. Reached end of list.");
            break;
        }

        previousRowCount = currentRowCount;

        // 🔥 Scroll to absolute bottom to trigger Ionic infinite scroll
        await driver.execute(() => {
            const ionContent = document.querySelector('ion-content');
            if (!ionContent) return;

            const scrollEl = (ionContent as any)?.shadowRoot
                ?.querySelector('.inner-scroll');

            if (scrollEl) {
                scrollEl.scrollTop = scrollEl.scrollHeight;
            }
        });

        // Wait for lazy loading API to complete
        await driver.pause(4000);
    }

    if (!found) {
        throw new Error(`PO ${poNumber} never appeared in Goods Receipt list`);
    }

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