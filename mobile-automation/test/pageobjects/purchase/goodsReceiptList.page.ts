import BasePage from '../base.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING PO USING SEARCH BAR: ${poNumber} ==========\n`);

        const targetPo = poNumber.trim();

        // 1️⃣ Ensure WEBVIEW
        const contexts = await driver.getContexts() as string[];
        const webview = contexts.find(ctx => ctx.includes('WEBVIEW'));

        if (!webview) {
            throw new Error('WEBVIEW not available on Goods Receipt page');
        }

        await driver.switchContext(webview);

        // 2️⃣ Wait for list page
        await browser.waitUntil(async () => {
            const rows = await $$('ion-row');
            return rows.length > 0;
        }, { timeout: 30000 });

        // 3️⃣ Use Search (NO SCROLLING ANYMORE)
        const searchInput = await $('ion-searchbar input');

        await searchInput.waitForDisplayed({ timeout: 15000 });
        await searchInput.click();
        await searchInput.clearValue();
        await searchInput.setValue(targetPo);

        console.log('🔎 Searching PO via backend filter...');

        // allow API filter
        await browser.pause(3000);

        const poSelector = `//ion-col[normalize-space()="${targetPo}"]`;

        await browser.waitUntil(async () => {
            return (await $$(poSelector)).length > 0;
        }, {
            timeout: 20000,
            timeoutMsg: `PO ${poNumber} not found after search`
        });

        const poCell = await $(poSelector);

        await poCell.scrollIntoView();
        await poCell.click();

        console.log(`✅ PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();