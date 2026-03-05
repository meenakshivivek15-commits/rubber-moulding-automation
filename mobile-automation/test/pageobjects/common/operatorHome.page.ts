import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

  async ensureTilesVisible(): Promise<void> {

    console.log("Waiting for dashboard tiles to appear...");

    await browser.waitUntil(async () => {

      const tiles = await $$('ion-text');
      const count = await tiles.length;

      console.log("Visible module count:", count);

      return count >= 6;

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

      console.log(`Searching dashboard attempt ${i}`);

      const index = await this.getModuleIndex(tileName);

      if (index >= 0) {

        console.log(`Module found at index ${index}`);

        const img = await $(
          `//ion-text[normalize-space()='${tileName}']/preceding-sibling::ion-img`
        );

        await img.waitForExist({ timeout: 10000 });

        await img.scrollIntoView();

        await this.safeClick(img);

        return;
      }

      console.log("Module not visible yet — scrolling dashboard");

      await this.scrollDashboard();

      await browser.waitUntil(async () => {

        const labels = await $$('ion-text');
        const count = await labels.length;

        console.log(`After scroll ${i}, visible modules: ${count}`);

        return count > 5;

      }, {
        timeout: 5000,
        interval: 500
      });
    }

    throw new Error(`Module ${tileName} not found after scrolling`);
  }


  async getModuleIndex(tileName: string): Promise<number> {

    const labels = await $$('ion-text');
    const labelcount= await labels.length;
    console.log("Checking module names, count:", labelcount);
    for (let i = 0; i < labelcount; i++) {

      const text = (await labels[i].getText()).trim();

      console.log(`Module ${i}: ${text}`);

      if (text === tileName) {
        return i;
      }
    }

    return -1;
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