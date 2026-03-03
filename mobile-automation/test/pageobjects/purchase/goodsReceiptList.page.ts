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

    // 2️⃣ Wait for rows to load
    await browser.waitUntil(async () => {
        const rows = await $$('//ion-grid[@id="grid"]//ion-row').length;
        return rows > 1;
    }, {
        timeout: 40000,
        timeoutMsg: 'Rows did not load'
    });

    // 3️⃣ Directly locate PO (no manual scrolling needed)
    const poSelector =
        `//ion-grid[@id="grid"]//ion-col[normalize-space()="${poNumber}"]`;

    const poCell = await $(poSelector);

    await poCell.waitForExist({ timeout: 20000 });

    await poCell.scrollIntoView();
    await browser.pause(500);

    await poCell.click();

    console.log(`✅ PO ${poNumber} clicked successfully`);
}

}

export default new GoodsReceiptListPage();