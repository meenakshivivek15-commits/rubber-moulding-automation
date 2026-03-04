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

    const tiles = await $$('ion-img');
    const tilecount = await tiles.length;
    console.log("Tile count:", tiles.length);
    console.log("Opening module:", tileName);
     
    if (tilecount < 23) {
        throw new Error(`Expected at least 23 tiles but found ${tiles.length}`);
    }

    // GoodsReceipt = tile 23
    if (tileName === "GoodsReceipt") {

        const tile = tiles[22];

        await tile.scrollIntoView();
        await tile.waitForDisplayed({ timeout: 10000 });

        console.log("Clicking GoodsReceipt tile (index 22)");

        await tile.click();
        return;
    }

    throw new Error(`Tile mapping not defined for: ${tileName}`);
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