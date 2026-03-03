import BasePage from '../base.page';
import goodsReceiptForm from './goodsReceiptForm.page';
class GoodsReceiptListPage extends BasePage {

    private async getGridData(): Promise<string[]> {
        return browser.execute(() => {
            const normalize = (value: string) =>
                value.replace(/\s+/g, ' ').trim().toUpperCase();

            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const shadowRoot = ionContent?.shadowRoot;

            const grid =
                (shadowRoot?.querySelector('ion-grid#grid, ion-grid') ||
                    document.querySelector('ion-grid#grid, ion-grid')) as HTMLElement | null;

            if (!grid) return [];

            const rows = Array.from(grid.querySelectorAll('ion-row')) as HTMLElement[];

            if (rows.length <= 1) return []; // only header

            const headerRow = rows[0];
            const headerCols = Array.from(headerRow.querySelectorAll('ion-col')) as HTMLElement[];

            const headerTexts = headerCols.map(col =>
                normalize(col.textContent || '')
            );

            const detectedPoIndex = headerTexts.findIndex(text =>
                text.includes('PO')
            );

            const poColumnIndex = detectedPoIndex >= 0 ? detectedPoIndex : 0;

            const dataRows = rows.slice(1);

            return dataRows
                .map(row => {
                    const cols = Array.from(row.querySelectorAll('ion-col')) as HTMLElement[];
                    const value =
                        cols[poColumnIndex]?.textContent ||
                        cols[0]?.textContent ||
                        '';
                    return normalize(value);
                })
                .filter(Boolean);
        }) as unknown as string[];
    }

    private async clickPo(poValue: string): Promise<boolean> {
        return browser.execute((po: string) => {
            const normalize = (value: string) =>
                value.replace(/\s+/g, ' ').trim().toUpperCase();

            const ionContent = document.querySelector('ion-content') as HTMLElement | null;
            const shadowRoot = ionContent?.shadowRoot;

            const grid =
                (shadowRoot?.querySelector('ion-grid#grid, ion-grid') ||
                    document.querySelector('ion-grid#grid, ion-grid')) as HTMLElement | null;

            if (!grid) return false;

            const rows = Array.from(grid.querySelectorAll('ion-row')) as HTMLElement[];

            if (rows.length <= 1) return false;

            const headerRow = rows[0];
            const headerCols = Array.from(headerRow.querySelectorAll('ion-col')) as HTMLElement[];

            const headerTexts = headerCols.map(col =>
                normalize(col.textContent || '')
            );

            const detectedPoIndex = headerTexts.findIndex(text =>
                text.includes('PO')
            );

            const poColumnIndex = detectedPoIndex >= 0 ? detectedPoIndex : 0;

            const dataRows = rows.slice(1);

            for (const row of dataRows) {
                const cols = Array.from(row.querySelectorAll('ion-col')) as HTMLElement[];
                const value =
                    normalize(cols[poColumnIndex]?.textContent || '');

                if (value === po) {
                    row.scrollIntoView({ block: 'center' });
                    row.click();
                    return true;
                }
            }

            return false;
        }, poValue);
    }

    async selectFirstAvailablePo(): Promise<string> {

    console.log('\n========== SELECTING FIRST AVAILABLE PO ==========\n');

    // Ensure WEBVIEW
    const context = String(await driver.getContext());
    if (!context.includes('WEBVIEW')) {
        const contexts = await driver.getContexts() as string[];
        const webview = contexts.find(c => c.includes('WEBVIEW'));
        if (!webview) throw new Error('WEBVIEW context not found');
        await driver.switchContext(webview);
    }

    console.log('Active context:', await driver.getContext());

    // Wait for ion-content
    await browser.waitUntil(async () => {
        const exists = await browser.execute(() =>
            !!document.querySelector('ion-content')
        );
        return Boolean(exists);
    }, {
        timeout: 30000,
        timeoutMsg: 'Goods Receipt page did not render'
    });

    // Wait for data rows
    await browser.waitUntil(async () => {
        const poList = await this.getGridData();
        return poList.length > 0;
    }, {
        timeout: 90000,
        timeoutMsg: 'No POs available in Goods Receipt'
    });

    const poList = await this.getGridData();

    if (poList.length === 0) {
        throw new Error('No POs available in Goods Receipt');
    }

    const selectedPo = poList[0];

    console.log(`Using dynamic PO: ${selectedPo}`);

    const clicked = await this.clickPo(selectedPo);

    if (!clicked) {
        throw new Error(`Failed to click PO ${selectedPo}`);
    }

    console.log(`✅ PO ${selectedPo} clicked successfully`);

    // 🔥 WAIT FOR GOODS RECEIPT FORM PAGE TO LOAD
    await browser.waitUntil(async () => {
        return await goodsReceiptForm.formHeader.isExisting();
    }, {
        timeout: 30000,
        timeoutMsg: 'Goods Receipt page did not load'
    });

    console.log('Goods Receipt page loaded successfully');

    return selectedPo;
}
}

export default new GoodsReceiptListPage();