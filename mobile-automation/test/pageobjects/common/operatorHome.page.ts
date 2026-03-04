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

    // preload dashboard tiles (important for Ionic lazy loading)
    for (let i = 0; i < 3; i++) {
        await this.scrollGrid("down");
        await browser.pause(1200);
    }

    const tileSelector =
        `//ion-text[contains(normalize-space(),"${tileName}")]/ancestor::ion-col//ion-img`;

    const tile = await $(tileSelector);

    await tile.waitForDisplayed({ timeout: 20000 });

    console.log(`Clicking module: ${tileName}`);

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