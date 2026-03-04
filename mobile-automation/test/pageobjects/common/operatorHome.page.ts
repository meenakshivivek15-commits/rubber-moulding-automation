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

    // Wait until the module label exists
    await browser.waitUntil(async () => {

        const labels = await $$('ion-text');
        const texts = [];

        for (const label of labels) {
            const text = (await label.getText()).trim();
            texts.push(text);
        }

        console.log("Available modules:", texts.join(", "));

        return texts.includes(tileName);

    }, {
        timeout: 30000,
        interval: 2000,
        timeoutMsg: `Module ${tileName} did not appear on dashboard`
    });

    // Now locate the tile
    const tile = await $(`//ion-text[normalize-space()="${tileName}"]/ancestor::ion-col//ion-img`);

    await tile.scrollIntoView();
    await tile.waitForDisplayed({ timeout: 20000 });

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