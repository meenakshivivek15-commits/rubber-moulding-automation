import BasePage from '../base.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

    console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

    await driver.waitUntil(async () => {
        const contexts = await driver.getContexts() as string[];
        const webview = contexts.find(ctx => ctx.includes('WEBVIEW'));
        if (!webview) {
            return false;
        }
        await driver.switchContext(webview);
        return true;
    }, { timeout: 30000, interval: 1000, timeoutMsg: 'WEBVIEW not available in time' });

    const poSelector = `//ion-col[normalize-space()="${poNumber}"]`;

    await driver.waitUntil(async () => {
        const ionContentExists = await $('ion-content').isExisting();
        const ionGridExists = await $('ion-grid').isExisting();
        const ionListExists = await $('ion-list').isExisting();
        const poCount = await (await $$(poSelector)).length;

        return ionContentExists || ionGridExists || ionListExists || poCount > 0;
    }, { timeout: 30000, interval: 1000, timeoutMsg: 'Goods Receipt list container did not load' });

    let found = false;

    for (let i = 0; i < 25; i++) {

        const count = await (await $$(poSelector)).length;
        if (count > 0) {
            found = true;
            break;
        }

        console.log(`Scrolling... attempt ${i + 1}`);

        await driver.execute(async () => {
            const content = document.querySelector('ion-content') as any;
            if (content && typeof content.getScrollElement === 'function') {
                const scrollElement = await content.getScrollElement();
                scrollElement.scrollTop += 900;
            } else {
                window.scrollBy(0, 900);
            }
        });

        await driver.pause(500);
    }

    if (!found) {
        throw new Error(`PO ${poNumber} not found after scrolling entire list`);
    }

    const poCell = await $(poSelector);

    await poCell.scrollIntoView();
    await driver.pause(500);
    await poCell.click();

    console.log(`PO ${poNumber} clicked successfully`);
}
}

export default new GoodsReceiptListPage();