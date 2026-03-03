import BasePage from '../base.page';

class GoodsReceiptListPage extends BasePage {

    async selectPoFromList(poNumber: string): Promise<void> {

    console.log(`\n========== SEARCHING FOR PO: ${poNumber} ==========\n`);

    // 1️⃣ Ensure WEBVIEW
    const context = String(await driver.getContext());
    if (!context.includes('WEBVIEW')) {
        const contexts = await driver.getContexts() as string[];
        const webview = contexts.find(c => c.includes('WEBVIEW'));
        if (!webview) throw new Error('WEBVIEW context not found');
        await driver.switchContext(webview);
    }

    console.log("Active context:", await driver.getContext());

    // 2️⃣ Wait for page + grid + initial rows inside ion-content shadow root
    await browser.waitUntil(async () => {
        const hasContent = await browser.execute(() => !!document.querySelector('ion-content'));
        return Boolean(hasContent);
    }, { timeout: 30000, timeoutMsg: 'Goods Receipt page did not render (ion-content missing)' });

    await browser.waitUntil(async () => {
        const rowCount = await browser.execute(() => {
            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const shadowRoot = ionContent?.shadowRoot;
            const grid = (shadowRoot?.querySelector('ion-grid#grid') || document.querySelector('ion-grid#grid')) as HTMLElement | null;
            if (!grid) return 0;

            const rows = grid.querySelectorAll('ion-row');
            return rows.length;
        });

        return Number(rowCount) > 1;
    }, { timeout: 60000, timeoutMsg: 'Goods Receipt grid rows did not load' });

    // 3️⃣ Scroll until PO row appears (for virtualized/lazy-loaded grids)
    let previousLastRowText = '';
    let noChangeScrolls = 0;

    for (let attempt = 0; attempt < 140; attempt++) {
        const probe = await browser.execute((targetPo: string) => {
            const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const shadowRoot = ionContent?.shadowRoot;
            const grid = (shadowRoot?.querySelector('ion-grid#grid') || document.querySelector('ion-grid#grid')) as HTMLElement | null;

            if (!grid) {
                return { clicked: false, rowCount: 0, lastRowText: '' };
            }

            const rows = Array.from(grid.querySelectorAll('ion-row')) as HTMLElement[];
            const dataRows = rows.length > 1 ? rows.slice(1) : rows;

            for (const row of dataRows) {
                const cols = Array.from(row.querySelectorAll('ion-col')) as HTMLElement[];
                const poColText = normalize(cols[3]?.textContent || '');

                if (poColText === normalize(targetPo)) {
                    row.scrollIntoView({ block: 'center' });
                    row.click();
                    return { clicked: true, rowCount: dataRows.length, lastRowText: poColText };
                }
            }

            const lastDataRow = dataRows[dataRows.length - 1];
            const lastCols = lastDataRow ? Array.from(lastDataRow.querySelectorAll('ion-col')) as HTMLElement[] : [];
            const lastRowText = normalize(lastCols[3]?.textContent || lastDataRow?.textContent || '');

            const contentScroller = shadowRoot?.querySelector('.inner-scroll, main, [part="scroll"]') as HTMLElement | null;
            if (contentScroller) {
                contentScroller.scrollBy(0, Math.floor(contentScroller.clientHeight * 0.8));
            } else if (ionContent && 'scrollBy' in ionContent) {
                (ionContent as any).scrollBy(0, Math.floor(window.innerHeight * 0.8));
            } else {
                window.scrollBy(0, Math.floor(window.innerHeight * 0.8));
            }

            return { clicked: false, rowCount: dataRows.length, lastRowText };
        }, poNumber) as { clicked: boolean; rowCount: number; lastRowText: string };

        if (probe.clicked) {
            console.log(`✅ PO ${poNumber} clicked successfully`);
            return;
        }

        if (probe.rowCount === 0) {
            await browser.pause(300);
            continue;
        }

        const lastRowText = probe.lastRowText;

        if (lastRowText === previousLastRowText) {
            noChangeScrolls++;
        } else {
            previousLastRowText = lastRowText;
            noChangeScrolls = 0;
        }

        if (noChangeScrolls >= 4) {
            throw new Error(`PO ${poNumber} not found after reaching end of list`);
        }

        await browser.pause(350);
    }

    throw new Error(`PO ${poNumber} not found after maximum scroll attempts`);
}

}

export default new GoodsReceiptListPage();