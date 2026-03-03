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

    // 2️⃣ Wait for rows
    await browser.waitUntil(async () => {
        const rows = await $$('//ion-grid[@id="grid"]//ion-row');
        const rowCount = await rows.length;
        return rowCount > 1;
    }, { timeout: 40000 });

    // 3️⃣ Find row
    const rowSelector =
    `//ion-grid[@id="grid"]//ion-row[contains(., "${poNumber}")]`;

    const poRow = await $(rowSelector);

    await poRow.waitForExist({ timeout: 20000 });
    await poRow.scrollIntoView();
    await poRow.click();

    console.log(`✅ PO ${poNumber} clicked successfully`);
}

}

export default new GoodsReceiptListPage();