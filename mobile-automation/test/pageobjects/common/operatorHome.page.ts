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

    console.log(`Opening module: ${tileName}`);

    const tileSelector =
        `//ion-text[contains(normalize-space(),"${tileName}")]/ancestor::ion-col//ion-img`;

    let found = false;

    for (let attempt = 1; attempt <= 6; attempt++) {

        console.log(`Searching dashboard (attempt ${attempt})`);

        const elements = await $$(tileSelector);
        const count = await elements.length;
        console.log(`Matching tiles: ${count}`);
        if (count > 0) {

            const tile = elements[0];

            await tile.scrollIntoView();
            await tile.waitForDisplayed({ timeout: 10000 });

            console.log(`Clicking module tile: ${tileName}`);

            await this.safeClick(tile);

            found = true;
            break;
        }

        console.log("Module not visible yet — scrolling dashboard");

        await this.scrollGrid("down");
        await browser.pause(1500);
    }

    if (!found) {
        throw new Error(`Module ${tileName} not found after scrolling dashboard`);
    }
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