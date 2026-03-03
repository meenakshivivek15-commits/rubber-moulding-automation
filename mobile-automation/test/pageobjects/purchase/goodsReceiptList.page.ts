import BasePage from '../base.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

    console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

    // 1️⃣ Ensure WEBVIEW
    const context = String(await driver.getContext());
    if (!context.includes('WEBVIEW')) {
        const contexts = await driver.getContexts() as string[];
        const webview = contexts.find(c => c.includes('WEBVIEW'));
        if (!webview) throw new Error('WEBVIEW context not found');
        await driver.switchContext(webview);
    }

    console.log("Active context:", await driver.getContext());

    // 2️⃣ Wait for page + initial rows (use generic selector, #grid may not always exist)
    await browser.waitUntil(async () => {
        const hasContent = await browser.execute(() => !!document.querySelector('ion-content'));
        return Boolean(hasContent);
    }, { timeout: 30000, timeoutMsg: 'Goods Receipt page did not render (ion-content missing)' });

    await browser.waitUntil(async () => {
        const rows = await $$('ion-row');
        const rowCount = await rows.length;
        return rowCount > 0;
    }, { timeout: 60000, timeoutMsg: 'Goods Receipt rows did not load' });

    // 3️⃣ Scroll until PO row appears (for virtualized/lazy-loaded grids)
    let previousLastRowText = '';
    let noChangeScrolls = 0;

    for (let attempt = 0; attempt < 120; attempt++) {
        const rowSelector = `//ion-row[contains(normalize-space(.), "${poNumber}")]`;
        const poRow = await $(rowSelector);

        if (await poRow.isExisting()) {
            await poRow.scrollIntoView();
            await browser.pause(200);
            await poRow.click();
            console.log(`✅ PO ${poNumber} clicked successfully`);
            return;
        }

        const rows = await $$('ion-row');
        const rowCount = await rows.length;
        if (rowCount === 0) {
            await browser.pause(300);
            continue;
        }

        const lastRow = rows[rowCount - 1];
        const lastRowText = (await lastRow.getText()).trim();

        if (lastRowText === previousLastRowText) {
            noChangeScrolls++;
        } else {
            previousLastRowText = lastRowText;
            noChangeScrolls = 0;
        }

        if (noChangeScrolls >= 4) {
            throw new Error(`PO ${poNumber} not found after reaching end of list`);
        }

        await browser.execute(() => {
            const ionContent = document.querySelector('ion-content') as any;
            const shadowRoot = ionContent?.shadowRoot;
            const contentScroller = shadowRoot?.querySelector('.inner-scroll, main, [part="scroll"]') as HTMLElement | null;

            if (contentScroller) {
                contentScroller.scrollBy(0, Math.floor(contentScroller.clientHeight * 0.8));
                return;
            }

            if (ionContent && typeof ionContent.scrollBy === 'function') {
                ionContent.scrollBy(0, Math.floor(window.innerHeight * 0.8));
                return;
            }

            window.scrollBy(0, Math.floor(window.innerHeight * 0.8));
        });
        await browser.pause(350);
    }

    throw new Error(`PO ${poNumber} not found after maximum scroll attempts`);
}

}

export default new GoodsReceiptListPage();