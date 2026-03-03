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

            return grid.querySelectorAll('ion-row').length;
        });

        return Number(rowCount) > 0;
    }, { timeout: 60000, timeoutMsg: 'Goods Receipt grid rows did not load' });

    // 3️⃣ Scroll until PO row appears (for virtualized/lazy-loaded grids)
    let previousLastRowSignature = '';
    let noChangeScrolls = 0;
    let endReachedRetries = 0;
    const maxEndReachedRetries = 8;
    const retryBackoffMs = 10000;

    for (let attempt = 0; attempt < 220; attempt++) {
        const probe = await browser.execute((targetPo: string) => {
            const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
            const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const normalizedTargetPo = normalize(targetPo);
            const poTokenRegex = new RegExp(`(^|\\W)${escapeRegExp(normalizedTargetPo)}(\\W|$)`);

            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const shadowRoot = ionContent?.shadowRoot;
            const grid = (shadowRoot?.querySelector('ion-grid#grid') || document.querySelector('ion-grid#grid')) as HTMLElement | null;

            const rows = grid ? (Array.from(grid.querySelectorAll('ion-row')) as HTMLElement[]) : [];

            if (rows.length === 0) {
                return {
                    clicked: false,
                    rowCount: 0,
                    lastRowText: '',
                    didScroll: false,
                    poColumnIndex: -1,
                    scrollTop: 0,
                    scrollLeft: 0,
                    sampleHeader: ''
                };
            }

            const headerRow = rows[0];
            const headerCols = headerRow ? (Array.from(headerRow.querySelectorAll('ion-col')) as HTMLElement[]) : [];
            const headerTexts = headerCols.map(col => normalize((col.textContent || '').toUpperCase()));
            const detectedPoIndex = headerTexts.findIndex(text => text.includes('PO'));
            const poColumnIndex = detectedPoIndex >= 0 ? detectedPoIndex : 3;
            const sampleHeader = headerTexts.join(' | ');

            const dataRows = rows.length > 1 ? rows.slice(1) : rows;

            const tryFindAndClick = () => {
                for (const row of dataRows) {
                    const cols = Array.from(row.querySelectorAll('ion-col')) as HTMLElement[];
                    const allColTexts = cols.map(col => normalize(col.textContent || ''));
                    const poColText = allColTexts[poColumnIndex] || '';
                    const hasExactPo = allColTexts.some(text => text === normalizedTargetPo);
                    const hasPoToken = allColTexts.some(text => poTokenRegex.test(text));

                    if (hasExactPo || hasPoToken || poColText === normalizedTargetPo) {
                        row.scrollIntoView({ block: 'center' });
                        row.click();
                        return {
                            clicked: true,
                            rowCount: dataRows.length,
                            lastRowText: poColText,
                            didScroll: false,
                            poColumnIndex,
                            scrollTop: 0,
                            scrollLeft: 0,
                            sampleHeader
                        };
                    }
                }

                return null;
            };

            const firstPass = tryFindAndClick();
            if (firstPass) {
                return { ...firstPass, didScroll: false, poColumnIndex, sampleHeader };
            }

            const contentScroller = shadowRoot?.querySelector('.inner-scroll, main, [part="scroll"]') as HTMLElement | null;
            const horizontalScroller = (grid && grid.scrollWidth > grid.clientWidth ? grid : contentScroller) as HTMLElement | null;

            if (horizontalScroller && horizontalScroller.scrollWidth > horizontalScroller.clientWidth) {
                horizontalScroller.scrollLeft = horizontalScroller.scrollWidth;
                const secondPass = tryFindAndClick();
                if (secondPass) {
                    return { ...secondPass, didScroll: false, poColumnIndex, sampleHeader };
                }
                horizontalScroller.scrollLeft = 0;
            }

            const lastDataRow = dataRows[dataRows.length - 1];
            const lastCols = lastDataRow ? Array.from(lastDataRow.querySelectorAll('ion-col')) as HTMLElement[] : [];
            const lastRowSignature = normalize(lastCols.map(col => col.textContent || '').join(' | ') || lastDataRow?.textContent || '');

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

            const scrollTop = contentScroller?.scrollTop || 0;
            const scrollLeft = horizontalScroller?.scrollLeft || 0;

            return {
                clicked: false,
                rowCount: dataRows.length,
                lastRowText: lastRowSignature,
                didScroll,
                poColumnIndex,
                scrollTop,
                scrollLeft,
                sampleHeader
            };
        }, poNumber) as {
            clicked: boolean;
            rowCount: number;
            lastRowText: string;
            didScroll: boolean;
            poColumnIndex: number;
            scrollTop: number;
            scrollLeft: number;
            sampleHeader: string;
        };

        if (attempt % 5 === 0 || probe.clicked) {
            console.log(
                `🔎 Attempt ${attempt} | rows=${probe.rowCount} | poColIndex=${probe.poColumnIndex} | didScroll=${probe.didScroll} | top=${probe.scrollTop} | left=${probe.scrollLeft}`
            );
        }

        if (attempt === 0 && probe.sampleHeader) {
            console.log(`🧾 Header columns: ${probe.sampleHeader}`);
        }

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
            if (endReachedRetries < maxEndReachedRetries) {
                endReachedRetries++;

                console.log(`↻ Reached list end (retry ${endReachedRetries}/${maxEndReachedRetries}). Resetting to top and rescanning for PO ${poNumber}...`);

                await browser.execute(() => {
                    const ionContent = document.querySelector('ion-content') as HTMLElement | null;
                    const shadowRoot = ionContent?.shadowRoot;
                    const grid = (shadowRoot?.querySelector('ion-grid#grid') || document.querySelector('ion-grid#grid')) as HTMLElement | null;
                    const contentScroller = shadowRoot?.querySelector('.inner-scroll, main, [part="scroll"]') as HTMLElement | null;
                    const horizontalScroller = (grid && grid.scrollWidth > grid.clientWidth ? grid : contentScroller) as HTMLElement | null;

                    if (contentScroller) {
                        contentScroller.scrollTop = 0;
                    } else {
                        window.scrollTo(0, 0);
                    }

                    if (horizontalScroller) {
                        horizontalScroller.scrollLeft = 0;
                    }
                });

                previousLastRowSignature = '';
                noChangeScrolls = 0;
                await browser.pause(retryBackoffMs);
                continue;
            }

            throw new Error(`PO ${poNumber} not found after reaching end of list`);
        }

        await browser.pause(350);
    }

    throw new Error(`PO ${poNumber} not found after maximum scroll attempts`);
}

}

export default new GoodsReceiptListPage();