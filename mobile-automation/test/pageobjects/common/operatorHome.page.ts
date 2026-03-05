import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

  async ensureTilesVisible(): Promise<void> {

    console.log("Waiting for dashboard tiles to appear...");

    await browser.waitUntil(async () => {

        const tiles = await $$('ion-text');
        const count = await tiles.length;

        console.log("Visible module count:", count);

        return count >= 6;   // dashboard loaded

    }, {
        timeout: 60000,
        interval: 2000,
        timeoutMsg: "Dashboard tiles did not load"
    });

}
  async clickTile(tileName: string): Promise<void> {

    await this.ensureTilesVisible();
    await this.ensureWebView(90000);

    console.log(`Opening module: ${tileName}`);

    for (let i = 1; i <= 10; i++) {

        console.log(`Search attempt ${i}`);

        const label = await $(`//ion-text[normalize-space()='${tileName}']`);

        if (await label.isExisting()) {

            console.log("Module found");

            const tile = await label.$('ancestor::ion-col');

            await tile.scrollIntoView();
            await browser.pause(500);

            await this.safeClick(tile);

            return;
        }

        console.log("Scrolling dashboard");

        await this.scrollDashboard();

        await browser.pause(1500);
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

    async openModule(moduleName: string): Promise<void> {
        await this.clickTile(moduleName);
    }
}

export default new OperatorHomePage();