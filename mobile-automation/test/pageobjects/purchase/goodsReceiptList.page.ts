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
            const collect = (root: Document | ShadowRoot): Element[] => {
                const direct = Array.from(root.querySelectorAll('ion-row'));
                const hosts = Array.from(root.querySelectorAll('*')) as HTMLElement[];
                for (const host of hosts) {
                    if (host.shadowRoot) {
                        direct.push(...collect(host.shadowRoot));
                    }
                }
                return direct;
            };

            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const fromContent = ionContent?.shadowRoot ? collect(ionContent.shadowRoot) : [];
            const fromDocument = collect(document);
            const uniqueRows = new Set([...fromContent, ...fromDocument]);
            return uniqueRows.size;
        });

        return Number(rowCount) > 0;
    }, { timeout: 60000, timeoutMsg: 'Goods Receipt grid rows did not load' });

    // 3️⃣ Scroll until PO row appears (for virtualized/lazy-loaded grids)
    let previousLastRowSignature = '';
    let noChangeScrolls = 0;

    for (let attempt = 0; attempt < 140; attempt++) {
        const probe = await browser.execute((targetPo: string) => {
            const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
            const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const normalizedTargetPo = normalize(targetPo);
            const poTokenRegex = new RegExp(`(^|\\W)${escapeRegExp(normalizedTargetPo)}(\\W|$)`);
            const collectRows = (root: Document | ShadowRoot): HTMLElement[] => {
                const rows = Array.from(root.querySelectorAll('ion-row')) as HTMLElement[];
                const hosts = Array.from(root.querySelectorAll('*')) as HTMLElement[];
                for (const host of hosts) {
                    if (host.shadowRoot) {
                        rows.push(...collectRows(host.shadowRoot));
                    }
                }
                return rows;
            };

            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const shadowRoot = ionContent?.shadowRoot;
            const grid = (shadowRoot?.querySelector('ion-grid#grid') || document.querySelector('ion-grid#grid')) as HTMLElement | null;

            const rowsFromGrid = grid ? (Array.from(grid.querySelectorAll('ion-row')) as HTMLElement[]) : [];
            const rowsFromContent = shadowRoot ? collectRows(shadowRoot) : [];
            const rowsFromDocument = collectRows(document);
            const rows = Array.from(new Set([...rowsFromGrid, ...rowsFromContent, ...rowsFromDocument]));

            if (rows.length === 0) {
                return { clicked: false, rowCount: 0, lastRowText: '', didScroll: false };
            }

            const dataRows = rows.length > 1 ? rows.slice(1) : rows;

            for (const row of dataRows) {
                const cols = Array.from(row.querySelectorAll('ion-col')) as HTMLElement[];
                const allColTexts = cols.map(col => normalize(col.textContent || ''));
                const poColText = allColTexts[3] || '';
                const hasExactPo = allColTexts.some(text => text === normalizedTargetPo);
                const hasPoToken = allColTexts.some(text => poTokenRegex.test(text));

                if (hasExactPo || hasPoToken || poColText === normalizedTargetPo) {
                    row.scrollIntoView({ block: 'center' });
                    row.click();
                    return { clicked: true, rowCount: dataRows.length, lastRowText: poColText };
                }
            }

            const lastDataRow = dataRows[dataRows.length - 1];
            const lastCols = lastDataRow ? Array.from(lastDataRow.querySelectorAll('ion-col')) as HTMLElement[] : [];
            const lastRowSignature = normalize(lastCols.map(col => col.textContent || '').join(' | ') || lastDataRow?.textContent || '');

            const contentScroller = shadowRoot?.querySelector('.inner-scroll, main, [part="scroll"]') as HTMLElement | null;
            let didScroll = false;

            if (contentScroller) {
                const before = contentScroller.scrollTop;
                contentScroller.scrollBy(0, Math.floor(contentScroller.clientHeight * 0.8));
                didScroll = contentScroller.scrollTop > before;
            } else if (ionContent && 'scrollBy' in ionContent) {
                const before = window.scrollY;
                (ionContent as any).scrollBy(0, Math.floor(window.innerHeight * 0.8));
                didScroll = window.scrollY > before;
            } else {
                const before = window.scrollY;
                window.scrollBy(0, Math.floor(window.innerHeight * 0.8));
                didScroll = window.scrollY > before;
            }

            return { clicked: false, rowCount: dataRows.length, lastRowText: lastRowSignature, didScroll };
        }, poNumber) as { clicked: boolean; rowCount: number; lastRowText: string; didScroll: boolean };

        if (probe.clicked) {
            console.log(`✅ PO ${poNumber} clicked successfully`);
            return;
        }

        if (probe.rowCount === 0) {
            await browser.pause(300);
            continue;
        }

        const lastRowSignature = probe.lastRowText;

        if (lastRowSignature === previousLastRowSignature && !probe.didScroll) {
            noChangeScrolls++;
        } else {
            previousLastRowSignature = lastRowSignature;
            noChangeScrolls = 0;
        }

        if (noChangeScrolls >= 10) {
            throw new Error(`PO ${poNumber} not found after reaching end of list`);
        }

        await browser.pause(350);
    }

    throw new Error(`PO ${poNumber} not found after maximum scroll attempts`);
}

}

export default new GoodsReceiptListPage();