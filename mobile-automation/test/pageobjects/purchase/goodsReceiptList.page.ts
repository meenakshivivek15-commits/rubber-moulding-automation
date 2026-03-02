import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

        console.log(`\n========== SEARCHING PO BY SCROLL: ${poNumber} ==========\n`);
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

        const poSelector = `//ion-col[contains(translate(normalize-space(.), "abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "${targetPo}")]`;

        const scrollAndFind = async (maxScrolls: number): Promise<boolean> => {
            let stagnantRounds = 0;
            let lastViewportSignature = '';

            for (let step = 1; step <= maxScrolls; step++) {
                const elements = await $$(poSelector);
                const count = await elements.length;

                if (count > 0) {
                    const poCell = elements[0];
                    await poCell.scrollIntoView();
                    await driver.pause(300);
                    try {
                        await poCell.click();
                    } catch {
                        await driver.execute((el) => {
                            (el as HTMLElement).click();
                        }, poCell);
                    }
                    return true;
                }

                const viewport = await driver.execute(() => {
                    const normalize = (value: string) => value.replace(/\s+/g, '').toUpperCase();
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
                if (signature === lastViewportSignature) {
                    stagnantRounds++;
                } else {
                    stagnantRounds = 0;
                }
                lastViewportSignature = signature;

                console.log(`🔎 Scroll ${step}/${maxScrolls}: rows=${viewport.visibleRows}, first=${viewport.firstPo}, last=${viewport.lastPo}, stagnant=${stagnantRounds}`);

                await driver.execute(async () => {
                    const content = document.querySelector('ion-content') as any;
                    if (content && typeof content.getScrollElement === 'function') {
                        const scrollEl = await content.getScrollElement();
                        scrollEl.scrollTop += 1100;
                        scrollEl.dispatchEvent(new Event('scroll'));
                    } else {
                        window.scrollBy(0, 1100);
                    }
                });

                await driver.pause(stagnantRounds >= 2 ? 1800 : 1200);

                if (stagnantRounds >= 8) {
                    break;
                }
            }

            return false;
        };

        // 3️⃣ Pass 1: deep manual scroll
        let found = await scrollAndFind(140);

        // 4️⃣ Pass 2: reopen Goods Receipt once and retry manual scroll
        if (!found) {
            console.log('PO not found in pass 1 — reopening Goods Receipt from home and retrying');
            await browser.execute(() => {
                window.location.href = '/#/home';
            });
            await driver.pause(2500);
            await operatorHomePage.openGoodsReceipt();
            await driver.pause(2000);

            await browser.waitUntil(async () => {
                const rows = await $$('ion-row');
                const count = await rows.length;
                return count > 0;
            }, { timeout: 40000, timeoutMsg: 'Goods Receipt rows did not load after reopen' });

            found = await scrollAndFind(140);
        }

        if (!found) {
            throw new Error(`PO ${poNumber} not found after manual deep scrolling and one reopen`);
        }

        console.log(`✅ PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();