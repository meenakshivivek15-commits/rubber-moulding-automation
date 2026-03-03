import BasePage from '../base.page';

type GridProbe = {
    clicked: boolean;
    rowCount: number;
    poColumnIndex: number;
    sampleHeader: string;
    selectedPo: string;
    poValues: string[];
    lastRowSignature: string;
    didScroll: boolean;
};

class GoodsReceiptListPage extends BasePage {

    private async inspectGridStep(targetPo?: string, clickIfFound = false): Promise<GridProbe> {
        return browser.execute((po?: string, shouldClick?: boolean) => {
            const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
            const normalizedTargetPo = normalize(po || '').toUpperCase();

            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const shadowRoot = ionContent?.shadowRoot;
            const grid = (shadowRoot?.querySelector('ion-grid#grid, ion-grid') || document.querySelector('ion-grid#grid, ion-grid')) as HTMLElement | null;
            const contentScroller = shadowRoot?.querySelector('.inner-scroll, main, [part="scroll"]') as HTMLElement | null;
            const horizontalScroller = (grid && grid.scrollWidth > grid.clientWidth ? grid : contentScroller) as HTMLElement | null;

            const rows = grid
                ? (Array.from(grid.querySelectorAll('ion-row')) as HTMLElement[])
                : (Array.from((shadowRoot?.querySelectorAll('ion-row') || document.querySelectorAll('ion-row'))) as HTMLElement[]);

            if (rows.length === 0) {
                return {
                    clicked: false,
                    rowCount: 0,
                    poColumnIndex: -1,
                    sampleHeader: '',
                    selectedPo: '',
                    poValues: [],
                    lastRowSignature: '',
                    didScroll: false
                };
            }

            const headerRow = rows[0];
            const headerCols = headerRow ? (Array.from(headerRow.querySelectorAll('ion-col')) as HTMLElement[]) : [];
            const headerTexts = headerCols.map(col => normalize((col.textContent || '').toUpperCase()));
            const detectedPoIndex = headerTexts.findIndex(text => text.includes('PO'));
            const poColumnIndex = detectedPoIndex >= 0 ? detectedPoIndex : 3;
            const sampleHeader = headerTexts.join(' | ');

            const dataRows = rows.length > 1 ? rows.slice(1) : rows;

            if (dataRows.length === 0) {
                return {
                    clicked: false,
                    rowCount: 0,
                    poColumnIndex,
                    sampleHeader,
                    selectedPo: '',
                    poValues: [],
                    lastRowSignature: '',
                    didScroll: false
                };
            }

            if (horizontalScroller && horizontalScroller.scrollWidth > horizontalScroller.clientWidth) {
                horizontalScroller.scrollLeft = Math.max(0, horizontalScroller.scrollWidth - horizontalScroller.clientWidth);
            }

            const poValues = dataRows.map((row) => {
                const cols = Array.from(row.querySelectorAll('ion-col')) as HTMLElement[];
                const allColTexts = cols.map(col => normalize(col.textContent || ''));
                const poText = allColTexts[poColumnIndex] || allColTexts[0] || '';
                return poText.toUpperCase();
            }).filter(Boolean);

            if (normalizedTargetPo && shouldClick) {
                for (let index = 0; index < dataRows.length; index++) {
                    if (poValues[index] === normalizedTargetPo) {
                        const rowToClick = dataRows[index] as HTMLElement;
                        rowToClick.scrollIntoView({ block: 'center' });
                        rowToClick.click();
                        return {
                            clicked: true,
                            rowCount: dataRows.length,
                            poColumnIndex,
                            sampleHeader,
                            selectedPo: poValues[index],
                            poValues,
                            lastRowSignature: poValues[poValues.length - 1] || '',
                            didScroll: false
                        };
                    }
                }
            }

            const lastRowSignature = poValues[poValues.length - 1] || '';
            let didScroll = false;

            if (contentScroller) {
                const before = contentScroller.scrollTop;
                contentScroller.scrollBy(0, Math.floor(contentScroller.clientHeight * 0.8));
                didScroll = contentScroller.scrollTop > before;
            } else {
                const before = window.scrollY;
                window.scrollBy(0, Math.floor(window.innerHeight * 0.8));
                didScroll = window.scrollY > before;
            }

            return {
                clicked: false,
                rowCount: dataRows.length,
                poColumnIndex,
                sampleHeader,
                selectedPo: '',
                poValues,
                lastRowSignature,
                didScroll
            };
        }, targetPo, clickIfFound) as unknown as GridProbe;
    }

    private async resetGridScrollPosition(): Promise<void> {
        await browser.execute(() => {
            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const shadowRoot = ionContent?.shadowRoot;
            const grid = (shadowRoot?.querySelector('ion-grid#grid, ion-grid') || document.querySelector('ion-grid#grid, ion-grid')) as HTMLElement | null;
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
    }

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
        const result = await browser.execute(() => {
            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const shadowRoot = ionContent?.shadowRoot;
            const grid = (shadowRoot?.querySelector('ion-grid#grid, ion-grid') ||
                        document.querySelector('ion-grid#grid, ion-grid')) as HTMLElement | null;

            if (!grid) return false;

            const rows = Array.from(grid.querySelectorAll('ion-row'));
            if (rows.length <= 1) return false;

            const firstDataRow = rows[1] as HTMLElement;
            const text = (firstDataRow.textContent || '').trim();

            return text.length > 0;
        });

        return Boolean(result);
    }, {
        timeout: 90000,
        timeoutMsg: 'Goods Receipt data rows did not populate'
    });

    // 3️⃣ Load all available PO IDs first
    const normalizedTargetPo = poNumber.replace(/\s+/g, ' ').trim().toUpperCase();
    const loadedPoSet = new Set<string>();
    let previousLastRowSignature = '';
    let stagnationCount = 0;

    for (let preloadAttempt = 0; preloadAttempt < 220; preloadAttempt++) {
        const preloadProbe = await this.inspectGridStep();

        if (preloadAttempt === 0 && preloadProbe.sampleHeader) {
            console.log(`🧾 Header columns: ${preloadProbe.sampleHeader}`);
        }

        for (const value of preloadProbe.poValues) {
            loadedPoSet.add(value);
        }

        if (preloadProbe.lastRowSignature === previousLastRowSignature && !preloadProbe.didScroll) {
            stagnationCount++;
        } else {
            previousLastRowSignature = preloadProbe.lastRowSignature;
            stagnationCount = 0;
        }

        if (stagnationCount >= 8) {
            break;
        }

        await browser.pause(200);
    }

    if (loadedPoSet.size === 0) {
        throw new Error('No POs available for Goods Receipt');
    }

    if (!loadedPoSet.has(normalizedTargetPo)) {
        throw new Error(`PO ${poNumber} not found in loaded Goods Receipt records`);
    }

    // 4️⃣ Reset and search by matching each PO ID row
    await this.resetGridScrollPosition();
    previousLastRowSignature = '';
    stagnationCount = 0;

    for (let searchAttempt = 0; searchAttempt < 220; searchAttempt++) {
        const searchProbe = await this.inspectGridStep(poNumber, true);

        if (searchProbe.clicked) {
            console.log(`✅ PO ${poNumber} clicked successfully`);
            return;
        }

        if (searchProbe.lastRowSignature === previousLastRowSignature && !searchProbe.didScroll) {
            stagnationCount++;
        } else {
            previousLastRowSignature = searchProbe.lastRowSignature;
            stagnationCount = 0;
        }

        if (stagnationCount >= 8) {
            break;
        }

        await browser.pause(200);
    }

    throw new Error(`PO ${poNumber} not found after scanning loaded Goods Receipt rows`);
}

}

export default new GoodsReceiptListPage();