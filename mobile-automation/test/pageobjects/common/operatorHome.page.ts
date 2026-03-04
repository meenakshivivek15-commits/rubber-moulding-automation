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

    console.log(`Searching for tile: ${tileName}`);

    await browser.waitUntil(async () => {

        const labels = await $$('ion-text');
        const labelCount = await labels.length;

        console.log("Detected tile labels:", labelCount);

        return labelCount > 5;

    }, { timeout: 20000, interval: 2000 });

    // Ensure page scrolls in case tile is below viewport
    await $('ion-content').scrollIntoView();

    const tileLabel = await $(`//ion-text[contains(., "${tileName}")]`);
    await tileLabel.waitForDisplayed({ timeout: 20000 });

    const tileContainer = await tileLabel.$('ancestor::ion-col');
    const tileImage = await tileContainer.$('ion-img');

    await tileImage.waitForClickable({ timeout: 20000 });

    console.log(`Clicking tile: ${tileName}`);

    await tileImage.click();
}

async openModule(moduleName: string): Promise<void> {
    await this.clickTile(moduleName);
}

}

export default new OperatorHomePage();