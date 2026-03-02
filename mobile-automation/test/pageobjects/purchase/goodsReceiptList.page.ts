import BasePage from '../base.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`Searching PO: ${poNumber}`);

        // 1️⃣ Ensure WEBVIEW
        const contexts = await driver.getContexts() as string[];
        const webview = contexts.find(ctx => ctx.includes('WEBVIEW'));
        if (webview) {
            await driver.switchContext(webview);
        }

        // 2️⃣ Wait for list to load
     await browser.waitUntil(async () => {
    const rows = await $$('ion-row');
    const count = await rows.length;   // 🔥 THIS is required in your setup
    return count > 0;
}, { timeout: 30000 });

        // 3️⃣ Use Search (no scrolling anymore)
        const searchInput = await $('ion-searchbar input');

        await searchInput.waitForDisplayed({ timeout: 10000 });
        await searchInput.click();
        await searchInput.clearValue();
        await searchInput.setValue(poNumber);

        // allow API filtering
        await browser.pause(3000);

        const poSelector = `//ion-col[normalize-space()="${poNumber}"]`;

        await browser.waitUntil(async () => {
    const elements = await $$(poSelector);
    const count = await elements.length;
    return count > 0;
}, {
    timeout: 30000,
    timeoutMsg: `PO ${poNumber} not found after search`
});

        const poCell = await $(poSelector);
        await poCell.scrollIntoView();
        await poCell.click();

        console.log(`PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();