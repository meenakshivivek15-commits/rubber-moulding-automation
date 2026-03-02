import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING PO BY NATIVE SWIPE: ${poNumber} ==========\n`);

        const targetPo = poNumber.replace(/\s+/g, '').toUpperCase();

        // 1️⃣ Ensure WEBVIEW
        const contexts = await driver.getContexts() as string[];
        const webview = contexts.find(ctx => ctx.includes('WEBVIEW'));

        if (webview) {
            await driver.switchContext(webview);
        } else {
            throw new Error('WEBVIEW context not available on Goods Receipt page');
        }

        // 2️⃣ Wait for list to load
        await browser.waitUntil(async () => {
            const rows = await $$('ion-row');
            const count = await rows.length;
            return count > 0;
        }, { timeout: 40000, timeoutMsg: 'Goods Receipt rows did not load' });

        const poSelector =
            `//ion-col[contains(translate(normalize-space(.), "abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "${targetPo}")]`;

        // 🔥 Native swipe function
        const swipeUp = async () => {
            await driver.performActions([{
                type: 'pointer',
                id: 'finger1',
                parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: 250, y: 900 },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pause', duration: 200 },
                    { type: 'pointerMove', duration: 600, x: 250, y: 250 },
                    { type: 'pointerUp', button: 0 }
                ]
            }]);
            await driver.releaseActions();
        };

        const scrollAndFind = async (maxScrolls: number): Promise<boolean> => {

            let stagnantRounds = 0;
            let lastSignature = '';

            for (let step = 1; step <= maxScrolls; step++) {

                const elements = await $$(poSelector);
                const count = await elements.length;

                if (count > 0) {
                    const poCell = elements[0];
                    await poCell.scrollIntoView();
                    await driver.pause(300);
                    await poCell.click();
                    return true;
                }

                const viewport = await driver.execute(() => {
                    const normalize = (v: string) => v.replace(/\s+/g, '').toUpperCase();
                    const rows = Array.from(document.querySelectorAll('ion-row'));
                    const poRegex = /\d{2}[A-Z]{2}\d{4}/;

                    const poValues = rows
                        .map(row => normalize(row.textContent || ''))
                        .map(text => text.match(poRegex)?.[0] || '')
                        .filter(Boolean);

                    return {
                        visibleRows: rows.length,
                        firstPo: poValues[0] || 'N/A',
                        lastPo: poValues[poValues.length - 1] || 'N/A'
                    };
                });

                const signature = `${viewport.firstPo}|${viewport.lastPo}`;

                if (signature === lastSignature) {
                    stagnantRounds++;
                } else {
                    stagnantRounds = 0;
                }

                lastSignature = signature;

                console.log(
                    `🔎 Swipe ${step}/${maxScrolls}: rows=${viewport.visibleRows}, first=${viewport.firstPo}, last=${viewport.lastPo}, stagnant=${stagnantRounds}`
                );

                // 🔥 Native swipe instead of DOM scroll
                await swipeUp();
                await driver.pause(1500);

                if (stagnantRounds >= 10) {
                    break;
                }
            }

            return false;
        };

        // 3️⃣ Pass 1 – deep swipe
        let found = await scrollAndFind(120);

        // 4️⃣ Pass 2 – reopen and retry once
        if (!found) {

            console.log('PO not found in pass 1 — reopening Goods Receipt and retrying');

            await browser.execute(() => {
                window.location.href = '/#/home';
            });

            await driver.pause(3000);
            await operatorHomePage.openGoodsReceipt();
            await driver.pause(3000);

            await browser.waitUntil(async () => {
                const rows = await $$('ion-row');
                const count = await rows.length;
                return count > 0;
            }, { timeout: 40000 });

            found = await scrollAndFind(120);
        }

        if (!found) {
            throw new Error(`PO ${poNumber} not found after native deep swiping and reopen`);
        }

        console.log(`✅ PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();