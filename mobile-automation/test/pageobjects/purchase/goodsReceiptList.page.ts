import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

    console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

    // Ensure WEBVIEW
    const context = await driver.getContext();
    if (!String(context).includes('WEBVIEW')) {
        const contexts = await driver.getContexts() as string[];
        const webview = contexts.find(ctx => ctx.includes('WEBVIEW'));
        if (!webview) throw new Error('WEBVIEW not found');
        await driver.switchContext(webview);
    }

    const poSelector = `//ion-col[normalize-space()="${poNumber}"]`;

    // Wait for grid to load
    await $('ion-grid#grid').waitForExist({ timeout: 15000 });

    let found = false;

    for (let i = 0; i < 20; i++) {

        const elements = await $$(poSelector);
        const count = await elements.length;
        if (count > 0) {
            found = true;
            break;
        }

        console.log(`Scrolling... attempt ${i + 1}`);

        // Scroll inside ion-content (IMPORTANT)
        await driver.execute(() => {
            const content = document.querySelector('ion-content');
            if (content) {
                content.scrollBy(0, 800);
            }
        });

        await driver.pause(700);
    }

    if (!found) {
        throw new Error(`PO ${poNumber} not found after scrolling entire list`);
    }

    const poCell = await $(poSelector);

    await poCell.scrollIntoView();
    await driver.pause(500);
    await poCell.click();

    console.log(`🔥 PO ${poNumber} clicked successfully`);
}
}

export default new GoodsReceiptListPage();