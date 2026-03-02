import BasePage from '../base.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

        // 1️⃣ Ensure WEBVIEW
        const context = String(await driver.getContext());

        if (!context.includes('WEBVIEW')) {
            const contexts = (await driver.getContexts()) as string[];
            const webview = contexts.find(c => c.includes('WEBVIEW'));
            if (!webview) throw new Error('WEBVIEW context not found');
            await driver.switchContext(webview);
        }

        console.log("Active context:", await driver.getContext());

        // 2️⃣ Wait for grid
        await browser.waitUntil(async () => {
            const grids = await $$('//ion-grid[@id="grid"]');
            const count = await grids.length;
            console.log("Grid count:", count);
            return count > 0;
        }, {
            timeout: 40000,
            timeoutMsg: 'Grid container not found'
        });

        // 3️⃣ Wait for rows
        await browser.waitUntil(async () => {
            const rows = await $$('//ion-grid[@id="grid"]//ion-row');
            const count = await rows.length;
            console.log("Row count:", count);
            return count > 1;
        }, {
            timeout: 40000,
            timeoutMsg: 'Rows did not load'
        });

        // 4️⃣ Scroll horizontally
        await browser.execute(() => {
            const grid = document.getElementById('grid');
            if (grid) grid.scrollLeft = grid.scrollWidth;
        });

        await browser.pause(1000);

        const poSelector =
            `//ion-grid[@id="grid"]//ion-col[normalize-space()="${poNumber}"]`;

        let found = false;
        let lastScrollTop = -1;

        // 5️⃣ Vertical infinite scroll
        for (let i = 0; i < 60; i++) {

           const elements = await $$(poSelector);
            const matches = await elements.length;

            console.log(`Scroll ${i} → matches:`, matches);

            if (matches > 0) {
                found = true;
                break;
            }

            const previousScrollTop = await browser.execute(() => {
                const grid = document.getElementById('grid');
                if (!grid) return -1;
                const prev = grid.scrollTop;
                grid.scrollTop += 800;
                grid.dispatchEvent(new Event('scroll'));
                return prev;
            });

            if (previousScrollTop === lastScrollTop) {
                console.log("Reached bottom of grid");
                break;
            }

            lastScrollTop = previousScrollTop as number;
            await browser.pause(1200);
        }

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