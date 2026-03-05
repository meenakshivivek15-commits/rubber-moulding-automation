import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

   async ensureTilesVisible(): Promise<void> {

    console.log("Waiting for dashboard modules...");

    await browser.waitUntil(async () => {

        let tiles = await $$('ion-text');
        let count = await tiles.length;

        console.log("Dashboard module count:", count);

        if (count < 27) {

            console.log("Scrolling to load more modules");

            await this.scrollGrid("down");
            await browser.pause(1500);

            tiles = await $$('ion-text');
            count = await tiles.length;

            console.log("After scroll module count:", count);
        }

        return count >= 27;

    }, {
        timeout: 60000,
        interval: 2000,
        timeoutMsg: "Dashboard did not load all modules"
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