import BasePage from '../base.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

        // -------------------------------
        // 1️⃣ Wait for WEBVIEW (CI safe)
        // -------------------------------
        await driver.waitUntil(async () => {
            const contexts = await driver.getContexts() as string[];
            const webview = contexts.find(ctx => ctx.includes('WEBVIEW'));
            if (!webview) return false;
            await driver.switchContext(webview);
            return true;
        }, {
            timeout: 30000,
            interval: 1000,
            timeoutMsg: 'WEBVIEW not available in time'
        });

        const poSelector = `//ion-col[normalize-space()="${poNumber}"]`;

        // -------------------------------
        // 2️⃣ Wait for list rows to render
        // -------------------------------
        await browser.waitUntil(async () => {
            const rows = await $$('ion-row');
            const count = await rows.length;
            return count > 1; 
        }, {
            timeout: 40000,
            interval: 2000,
            timeoutMsg: 'Goods Receipt rows did not load'
        });

        // -------------------------------
        // 3️⃣ Retry + Refresh loop (backend stabilization)
        // -------------------------------
        let found = false;

        for (let retry = 1; retry <= 5; retry++) {

            console.log(`\n🔁 Retry cycle ${retry}`);

            // Try scrolling full list
            for (let scroll = 0; scroll < 25; scroll++) {

                const elements = await $$(poSelector);
                const count = await elements.length;

                if (count > 0) {
                    found = true;
                    break;
                }

                await driver.execute(async () => {
                    const content = document.querySelector('ion-content') as any;
                    if (content && typeof content.getScrollElement === 'function') {
                        const scrollEl = await content.getScrollElement();
                        scrollEl.scrollTop += 900;
                    } else {
                        window.scrollBy(0, 900);
                    }
                });

                await driver.pause(500);
            }

            if (found) break;

            console.log("PO not found — refreshing Goods Receipt page");

            // 🔄 Refresh page (Angular safe reload)
            await driver.execute(() => {
                window.location.reload();
            });

            // Wait for rows again after refresh
            await browser.waitUntil(async () => {
                const rows = await $$('ion-row');
            const count = await rows.length;
            return count > 1; 
            }, {
                timeout: 30000,
                interval: 2000
            });

            await driver.pause(3000);
        }

        // -------------------------------
        // 4️⃣ Final validation
        // -------------------------------
        if (!found) {
            throw new Error(`PO ${poNumber} not found after retrying and refreshing list`);
        }

        // -------------------------------
        // 5️⃣ Click PO safely
        // -------------------------------
        const poCell = await $(poSelector);

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

        console.log(`✅ PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();