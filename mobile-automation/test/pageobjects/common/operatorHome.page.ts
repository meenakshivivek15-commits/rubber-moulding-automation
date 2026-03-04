import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    async ensureTilesVisible(): Promise<void> {

        // Wait for dashboard grid
        await $('ion-grid').waitForDisplayed({ timeout: 15000 });

        const tileElements = await $$('ion-img');
        const tileCount = await tileElements.length;

        if (tileCount > 5) {
            console.log(`Tiles already visible: ${tileCount}`);
            return;
        }

        console.log("Tiles not visible → opening settings");

        const settings = await $('ion-icon[name="settings"]');
        await settings.waitForDisplayed({ timeout: 10000 });
        await settings.click();

        await browser.pause(2000);

        const allBtn = await $('//ion-button[contains(.,"ALL")]');
        await allBtn.waitForDisplayed({ timeout: 10000 });
        await allBtn.click();

        await browser.pause(2000);

        console.log("Returning to home");

        await browser.back();

        // Wait until tiles appear
        await browser.waitUntil(async () => {

            const tiles = await $$('ion-img');
            const count = await tiles.length;

            console.log("Detected tiles:", count);

            return count > 5;

        }, {
            timeout: 10000,
            timeoutMsg: "Tiles did not appear after enabling ALL"
        });
    }


    async clickTile(tileName: string): Promise<void> {

        await this.ensureTilesVisible();
        await this.ensureWebView(90000);

        console.log(`Searching for tile: ${tileName}`);

        await browser.waitUntil(async () => {

            const labels = await $$('ion-text');
            const labelCount = await labels.length;

            return labelCount > 5;

        }, { timeout: 15000 });

        await $('ion-content').scrollIntoView();

        const tileLabel = await $(`//ion-text[contains(., "${tileName}")]`);
        await tileLabel.waitForDisplayed({ timeout: 10000 });

        const tileContainer = await tileLabel.$('ancestor::ion-col');
        const tileImage = await tileContainer.$('ion-img');

        await tileImage.click();
    }


    async openModule(moduleName: string): Promise<void> {
        await this.clickTile(moduleName);
    }

}

export default new OperatorHomePage();