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

    await this.ensureWebView();

    const target = moduleName.replace(/\s/g, '').toLowerCase();

    for (let attempt = 0; attempt < 8; attempt++) {

        const modules = await $$('//ion-col//ion-text');

        console.log(`Scan attempt ${attempt + 1} — modules detected: ${modules.length}`);

        for (const module of modules) {

            const text = (await module.getText()).trim();
            console.log("Found module:", text);

            const normalized = text.replace(/\s/g, '').toLowerCase();

            if (normalized === target) {

                console.log(`Module matched: ${text}`);

                const icon = await module.$('./preceding::ion-img[1]');

                await this.safeClick(icon);

                console.log(`${moduleName} module clicked successfully`);
                return;
            }
        }

        console.log("Module not visible — scrolling grid");

        await this.scrollGrid("down");

        if (attempt % 2 === 1) {
            await this.scrollDashboard();
        }
    }

    throw new Error(`Module ${moduleName} not found on dashboard`);
}
}

export default new OperatorHomePage();