import BasePage from '../base.page';

class OperatorHomePage extends BasePage {
    
    // ===== Locators =====

    private settingsIcon = '//*[@id="main"]/app-home/ion-header/ion-toolbar/ion-grid/ion-row/ion-col[4]/ion-img';

    private refreshIcon = '//*[@id="main"]/app-home/ion-header/ion-toolbar/ion-grid/ion-row/ion-col[3]/ion-img';

    private searchBox = '//*[@id="grid"]/form/ion-grid/ion-row[1]/ion-col[1]/ion-searchbar/div/input';

    private clearButton = '//*[@id="grid"]/form/ion-grid/ion-row[1]/ion-col[3]/ion-button';

    private backButton = '//*[@id="main"]/app-setting/ion-header/ion-toolbar/ion-back-button//button';

    async prepareDashboardForModule(moduleName: string): Promise<void> {

    console.log(`Preparing dashboard for module: ${moduleName}`);

    // open settings
    const settings = await $(this.settingsIcon);
    await this.safeClick(settings);

    // clear all modules
    const clearBtn = await $(this.clearButton);
    await clearBtn.waitForDisplayed({ timeout: 10000 });
    await this.safeClick(clearBtn);

    console.log("All modules cleared");

    // search module
    const search = await $(this.searchBox);
    await search.waitForDisplayed({ timeout: 10000 });
    await search.setValue(moduleName);

    // enable checkbox
    const checkbox = await $(`//ion-label[normalize-space()="${moduleName}"]/preceding::ion-checkbox`);

    if (!(await checkbox.isSelected())) {

        await checkbox.click();
        console.log(`${moduleName} enabled`);

    } else {

        console.log(`${moduleName} already enabled`);
    }

    // back to home
    const back = await $(this.backButton);
    await this.safeClick(back);

    // refresh dashboard
    const refresh = await $(this.refreshIcon);
    await this.safeClick(refresh);

    await browser.pause(2000);
}

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

    console.log(`Opening module: ${moduleName}`);

    const moduleLabel = await $(`//ion-text[normalize-space()="${moduleName}"]`);

    await moduleLabel.waitForDisplayed({ timeout: 20000 });

    const icon = await moduleLabel.$('./preceding::ion-img[1]');

    await this.safeClick(icon);

    console.log(`${moduleName} module clicked successfully`);
}
}
export default new OperatorHomePage();