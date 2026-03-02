import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

        // Ensure WEBVIEW
        const currentContext = String(await driver.getContext());
        if (!currentContext.includes('WEBVIEW')) {
            const contexts = await driver.getContexts() as string[];
            const webview = contexts.find(ctx => ctx.startsWith('WEBVIEW_'));
            if (!webview) throw new Error('WEBVIEW context not found');
            await driver.switchContext(webview);
        }

        const poSelector = `//ion-col[normalize-space()="${poNumber}"]`;

        // Wait for grid
        await browser.waitUntil(async () => {
            const rows = await $$('#grid ion-row').length > 0;
            return rows;
        }, { timeout: 30000 });

        const gridScrollAndFind = async (): Promise<boolean> => {

            let lastScrollTop = -1;

            for (let i = 0; i < 60; i++) {

                // 1️⃣ Horizontal scroll fully right
                await browser.execute(() => {
                    const grid = document.getElementById('grid');
                    if (grid) {
                        grid.scrollLeft = grid.scrollWidth;
                    }
                });

                // 2️⃣ Check for PO
                const elements = await $$(poSelector).length;
                if (elements > 0) {
                    return true;
                }

                // 3️⃣ Scroll vertically inside grid
                const currentScrollTop = await browser.execute(() => {
                    const grid = document.getElementById('grid');
                    if (grid) {
                        const old = grid.scrollTop;
                        grid.scrollTop += 800;
                        grid.dispatchEvent(new Event('scroll'));
                        return old;
                    }
                    return -1;
                });

                // Stop if no more scrolling possible
                if (currentScrollTop === lastScrollTop) {
                    break;
                }

                lastScrollTop = currentScrollTop as number;

                await browser.pause(1200); // allow infinite scroll API
            }

            return false;
        };

        const found = await gridScrollAndFind();

        if (!found) {
            throw new Error(`PO ${poNumber} not found after grid scrolling`);
        }

        const poCell = await $(poSelector);

        await poCell.scrollIntoView();
        await browser.pause(500);
        await poCell.click();

        console.log(`✅ PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();