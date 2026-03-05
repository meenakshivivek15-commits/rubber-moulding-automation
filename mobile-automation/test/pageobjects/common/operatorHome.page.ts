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

    let label;

    for (let i = 1; i <= 6; i++) {

        console.log(`Searching dashboard attempt ${i}`);

        label = await $(`//ion-text[normalize-space()='${tileName}']`);

        if (await label.isExisting()) {

            console.log("Module label found");

            const tile = await label.$('ancestor::ion-col');

            await tile.scrollIntoView();

            await this.safeClick(tile);

            return;
        }

        console.log("Module not visible — scrolling dashboard");

        await this.scrollGrid("down");
        await browser.pause(1500);
    }

    throw new Error(`Module ${tileName} not found after scrolling dashboard`);
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