import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    // ===== Locators =====

    private settingsIcon = '//*[@id="main"]/app-home/ion-header/ion-toolbar/ion-grid/ion-row/ion-col[4]/ion-img';
    private refreshIcon = '//*[@id="main"]/app-home/ion-header/ion-toolbar/ion-grid/ion-row/ion-col[3]/ion-img';
    private searchBox = '//*[@id="grid"]/form/ion-grid/ion-row[1]/ion-col[1]/ion-searchbar/div/input';
    private clearButton = '//*[@id="grid"]/form/ion-grid/ion-row[1]/ion-col[3]/ion-button';
    private backButton = '//*[@id="main"]/app-setting/ion-header/ion-toolbar/ion-back-button//button';


    // ===============================
    // Prepare dashboard for module
    // ===============================

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

        await browser.pause(1000); // allow Ionic filter to render results

        // wait for module text to appear
        const moduleText = await $(`//ion-text[normalize-space()="${moduleName}"]`);
        await moduleText.waitForDisplayed({ timeout: 15000 });

        // find checkbox relative to module text
       const checkbox = await $(`//ion-item[.//ion-text[normalize-space()="${moduleName}"]]//ion-checkbox`);

await checkbox.waitForDisplayed({ timeout: 15000 });

const checked = await checkbox.getAttribute("aria-checked");

if (checked !== "true") {

    await this.safeClick(checkbox);
    console.log(`${moduleName} enabled`);

} else {

    console.log(`${moduleName} already enabled`);
}
        // go back to dashboard
       console.log("Navigating back to dashboard");

await driver.back();

await browser.pause(1500);
        // refresh dashboard
        const refresh = await $(this.refreshIcon);

await refresh.waitForDisplayed({ timeout: 15000 });

await this.safeClick(refresh);

await this.ensureTilesVisible();;
    }


    // ===============================
    // Ensure dashboard tiles visible
    // ===============================

    async ensureTilesVisible(): Promise<void> {

        console.log("Waiting for dashboard to load...");

        await browser.waitUntil(async () => {

            const labels = await $$('ion-text');
            const count = await labels.length;

            console.log("Visible modules:", count);

            return count >= 1;

        }, {
            timeout: 60000,
            interval: 2000,
            timeoutMsg: "Dashboard tiles did not load"
        });
    }


    // ===============================
    // Click tile using fixed locator
    // ===============================

    async clickTile(tileName: string): Promise<void> {

        await this.ensureWebView(90000);
        await this.ensureTilesVisible();

        console.log(`Opening module: ${tileName}`);

        for (let i = 0; i < 8; i++) {

            const tile = await $('//*[@id="main"]/app-home/ion-content[2]/ion-grid/ion-row/div[23]/ion-col/ion-img');

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


    // ===============================
    // Print tiles (debug)
    // ===============================

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


    // ===============================
    // Debug dashboard
    // ===============================

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


    // ===============================
    // Open module
    // ===============================

    async openModule(moduleName: string): Promise<void> {

    await this.ensureWebView();

    console.log(`Opening module: ${moduleName}`);

    const moduleIcon = await $(
        `//ion-text[contains(normalize-space(),"${moduleName}")]/preceding::ion-img[1]`
    );

    await moduleIcon.waitForDisplayed({ timeout: 20000 });

    await this.safeClick(moduleIcon);

    console.log(`${moduleName} module clicked successfully`);
}
}

export default new OperatorHomePage();