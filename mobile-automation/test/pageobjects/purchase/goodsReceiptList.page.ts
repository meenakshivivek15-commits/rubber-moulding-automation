import BasePage from '../base.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);
        const targetPo = poNumber.replace(/\s+/g, '').toUpperCase();

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

        const poSelector = `//ion-col[contains(translate(normalize-space(.), "abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "${targetPo}")]`;

        // -------------------------------
        // 2️⃣ Wait for list rows to render
        // -------------------------------
        await browser.waitUntil(async () => {
            const rows = await $$('ion-row');
            const count = await rows.length;
            return count > 0;
        }, {
            timeout: 40000,
            interval: 2000,
            timeoutMsg: 'Goods Receipt rows did not load'
        });

        const deepScrollSearch = async (maxScrolls: number): Promise<boolean> => {
            let lastTail = '';
            let stagnantRounds = 0;

            for (let scroll = 0; scroll < maxScrolls; scroll++) {
                const elements = await $$(poSelector);
                const count = await elements.length;

                if (count > 0) {
                    const poCell = elements[0];
                    await poCell.scrollIntoView();
                    await driver.pause(400);
                    try {
                        await poCell.click();
                    } catch {
                        await driver.execute((el) => {
                            (el as HTMLElement).click();
                        }, poCell);
                    }
                    return true;
                }

                const tail = await driver.execute(() => {
                    const rows = Array.from(document.querySelectorAll('ion-row'));
                    const lastRow = rows[rows.length - 1];
                    return (lastRow?.textContent || '').replace(/\s+/g, '').toUpperCase();
                });

                if (tail === lastTail) {
                    stagnantRounds++;
                } else {
                    stagnantRounds = 0;
                }
                lastTail = String(tail || '');

                await driver.execute(async () => {
                    const content = document.querySelector('ion-content') as any;
                    if (content && typeof content.getScrollElement === 'function') {
                        const scrollEl = await content.getScrollElement();
                        scrollEl.scrollTop += 1100;
                    } else {
                        window.scrollBy(0, 1100);
                    }
                });

                await driver.pause(stagnantRounds >= 2 ? 1800 : 1200);

                if (stagnantRounds >= 6) {
                    break;
                }
            }

            return false;
        };

        // -------------------------------
        // 3️⃣ Deep scroll search (no refresh first)
        // -------------------------------
        let found = await deepScrollSearch(120);

        // -------------------------------
        // 4️⃣ Single refresh fallback
        // -------------------------------
        if (!found) {
            console.log('PO not found after deep scroll — refreshing once and retrying');

            await driver.execute(() => {
                window.location.reload();
            });

            await browser.waitUntil(async () => {
                const rows = await $$('ion-row');
                const count = await rows.length;
                return count > 0;
            }, {
                timeout: 30000,
                interval: 2000,
                timeoutMsg: 'Goods Receipt rows did not load after refresh'
            });

            await driver.pause(3000);
            found = await deepScrollSearch(120);
        }

        // -------------------------------
        // 5️⃣ Final validation
        // -------------------------------
        if (!found) {
            throw new Error(`PO ${poNumber} not found after deep scrolling and one refresh`);
        }

        console.log(`✅ PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();