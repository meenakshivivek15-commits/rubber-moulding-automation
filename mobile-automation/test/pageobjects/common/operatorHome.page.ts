import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

async ensureTilesVisible(): Promise<void> {

    console.log("Waiting for dashboard to load...");

    await browser.waitUntil(async () => {

        const labels = await $$('ion-text');
        const count = await labels.length;

        console.log("Visible modules:", count);

        return count >= 6;

    }, {
        timeout: 60000,
        interval: 2000,
        timeoutMsg: "Dashboard tiles did not load"
    });
}


    

async clickTile(tileName: string): Promise<void> {

    await this.ensureWebView(90000);
    await this.ensureTilesVisible();

    console.log(`Opening module: ${tileName}`);

    for (let i = 0; i < 8; i++) {

        const tile = await $(
        '//*[@id="main"]/app-home/ion-content[2]/ion-grid/ion-row/div[23]/ion-col/ion-img'
    );


        if (await tile.isExisting()) {

            console.log(`${tileName} module found`);

            await this.safeClick(tile);

            console.log(`${tileName} tile clicked`);

            return;
        }

        console.log(`Module not visible — scrolling dashboard (${i + 1})`);

        await this.scrollDashboard();

        await browser.pause(1200);
    }

    throw new Error(`Module ${tileName} not found after scrolling`);
}
async printAllTiles(): Promise<void> {

    await this.ensureWebView();
    await this.ensureTilesVisible();

    const labels = await $$('ion-text');

    console.log("\n===== DASHBOARD MODULES =====");

    for (const label of labels) {

        const text = (await label.getText()).trim();

        if (text.length > 0) {
            console.log("Module:", text);
        }

    }

    console.log("===== END MODULE LIST =====\n");
}

async debugDashboard(): Promise<void> {

    await this.ensureWebView();

    const tiles = await $$('ion-col');
    const count = await tiles.length;
    console.log("\n===== DASHBOARD TILE DEBUG =====");

    for (let i = 0; i < count; i++) {

        try {

            const label = await tiles[i].$('ion-text');
            const text = (await label.getText()).trim();

            console.log(`Tile ${i}: ${text}`);

        } catch {

            console.log(`Tile ${i}: (no label)`);

        }
    }

    console.log("===== END DASHBOARD DEBUG =====\n");
}

async openModule(moduleName: string): Promise<void> {

    console.log(`\n===== OPENING ${moduleName} MENU =====\n`);

    // 1️⃣ Ensure WEBVIEW
    await this.ensureWebView();

    await browser.pause(3000);

    // OLD working absolute XPath
    const receiptXpath =
        '//*[@id="main"]/app-home/ion-content[2]/ion-grid/ion-row/div[23]/ion-col/ion-img';

    for (let i = 0; i < 12; i++) {

        const tiles = await $$(receiptXpath);

        if (tiles.length > 0) {

            const tile = tiles[0];

            if (await tile.isDisplayed()) {

                console.log("GoodsReceipt tile found using old XPath");

                await tile.waitForClickable({ timeout: 15000 });
                await this.safeClick(tile);

                console.log("GoodsReceipt tile clicked");

                // 2️⃣ Wait for navigation
                await driver.waitUntil(async () => {

                    const url = await driver.execute(() => window.location.href);
                    console.log("Current URL:", url);

                    return !url.includes('/home');

                }, {
                    timeout: 20000,
                    interval: 1000,
                    timeoutMsg: "Navigation did not happen"
                });

                // 3️⃣ Confirm list page
                const grid = await $('//*[@id="grid"]');
                await grid.waitForDisplayed({ timeout: 30000 });

                console.log("Goods Receipt list page loaded");

                return;
            }
        }

        console.log(`Scrolling dashboard (${i + 1})`);

        await this.scrollDashboard();
    }

    throw new Error(`Module ${moduleName} not found after scrolling`);
}
}

export default new OperatorHomePage();