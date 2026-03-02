import BasePage from '../base.page';
import operatorHomePage from '../common/operatorHome.page';

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

        const seenPoNumbers = new Set<string>();

        const getVisibleListStats = async (): Promise<{
            visibleRowCount: number;
            visiblePoCount: number;
            firstPo: string;
            lastPo: string;
            visiblePoNumbers: string[];
        }> => {
            return driver.execute(() => {
                const normalize = (value: string) => value.replace(/\s+/g, '').toUpperCase();
                const rows = Array.from(document.querySelectorAll('ion-row'));
                const poRegex = /\b\d{2}[A-Z]{2}\d{4}\b/g;

                const poValues = rows
                    .map(row => {
                        const text = normalize((row.textContent || ''));
                        const matches = text.match(poRegex);
                        return matches && matches.length > 0 ? matches[0] : '';
                    })
                    .filter(Boolean);

                return {
                    visibleRowCount: rows.length,
                    visiblePoCount: poValues.length,
                    firstPo: poValues[0] || 'N/A',
                    lastPo: poValues[poValues.length - 1] || 'N/A',
                    visiblePoNumbers: poValues
                };
            });
        };

        const initialStats = await getVisibleListStats();
        initialStats.visiblePoNumbers.forEach(po => seenPoNumbers.add(po));
        console.log(`📊 Initial viewport rows: ${initialStats.visibleRowCount}, visible POs: ${initialStats.visiblePoCount}, unique seen so far: ${seenPoNumbers.size}`);
        console.log(`📌 Initial range: first=${initialStats.firstPo}, last=${initialStats.lastPo}`);

        const deepScrollSearch = async (maxScrolls: number): Promise<boolean> => {
            let lastTail = '';
            let stagnantRounds = 0;

            for (let scroll = 0; scroll < maxScrolls; scroll++) {
                const stats = await getVisibleListStats();
                stats.visiblePoNumbers.forEach(po => seenPoNumbers.add(po));
                console.log(`📊 Scroll ${scroll + 1}/${maxScrolls}: viewport rows=${stats.visibleRowCount}, visible POs=${stats.visiblePoCount}, unique seen=${seenPoNumbers.size}, first=${stats.firstPo}, last=${stats.lastPo}`);

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
        // 4️⃣ Single fallback: go Home and reopen Goods Receipt
        // -------------------------------
        if (!found) {
            console.log('PO not found after deep scroll — reopening Goods Receipt from home and retrying once');

            await browser.execute(() => {
                window.location.href = '/#/home';
            });
            await driver.pause(2500);

            await operatorHomePage.openGoodsReceipt();
            await driver.pause(1500);

            found = await deepScrollSearch(120);
        }

        // -------------------------------
        // 5️⃣ Final validation
        // -------------------------------
        if (!found) {
            throw new Error(`PO ${poNumber} not found after deep scrolling and reopening Goods Receipt once`);
        }

        console.log(`📈 Total unique PO numbers seen during search: ${seenPoNumbers.size}`);
        console.log(`✅ PO ${poNumber} clicked successfully`);
    }
}

export default new GoodsReceiptListPage();