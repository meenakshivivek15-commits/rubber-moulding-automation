import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    async ensureTilesVisible(): Promise<void> {

        console.log("Checking operator dashboard tiles...");

        await browser.waitUntil(async () => {

            const tiles = await $$('ion-img');
            const count = await tiles.length;

            console.log("Tile count:", count);

            return count >= 6;

        }, {
            timeout: 60000,
            interval: 2000,
            timeoutMsg: "Operator dashboard tiles did not load"
        });

    }

   async clickTile(tileName: string): Promise<void> {

    await this.ensureTilesVisible();
    await this.ensureWebView(90000);

    console.log("Opening module:", tileName);

    // locator: find module label then its tile image
    const tile = await $(`//ion-text[contains(normalize-space(),"${tileName}")]/ancestor::ion-col//ion-img`);

    await tile.waitForDisplayed({ timeout: 20000 });

    await tile.scrollIntoView();

    console.log(`Clicking module tile: ${tileName}`);

    await this.safeClick(tile);
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

    async openModule(moduleName: string): Promise<void> {
        await this.clickTile(moduleName);
    }

}

export default new OperatorHomePage();