import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

 async ensureTilesVisible(): Promise<void> {

    console.log("Waiting for dashboard tiles to stabilize...");

    let previousCount = 0;
    let stableCount = 0;

    await browser.waitUntil(async () => {

        const labels = await $$('ion-text');
        const currentCount = await labels.length;

        console.log("Visible module count:", currentCount);

        if (currentCount === previousCount) {
            stableCount++;
        } else {
            stableCount = 0;
        }

        previousCount = currentCount;

        return currentCount >= 6 && stableCount >= 2;

    }, {
        timeout: 60000,
        interval: 2000,
        timeoutMsg: "Dashboard modules did not stabilize"
    });
}


  async clickTile(tileName: string): Promise<void> {

    await this.ensureTilesVisible();
    await this.ensureWebView(90000);
await this.loadAllDashboardModules();
    console.log(`Opening module: ${tileName}`);

    for (let i = 1; i <= 12; i++) {

        console.log(`Searching dashboard attempt ${i}`);

        const img = await $(
        `//ion-col[.//ion-text[normalize-space()='${tileName}']]//ion-img`
        );

        if (await img.isExisting()) {

            console.log("Module found");

            await img.scrollIntoView();
            await this.safeClick(img);

            return;
        }

        console.log("Module not visible yet — scrolling dashboard");

        await this.scrollDashboard();
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

async debugDashboard(): Promise<void> {

    await this.ensureWebView();

    const tiles = await $$('ion-col');
    const tilecount = await tiles.length;
    console.log("Total dashboard tiles found:", tilecount);
    console.log("\n===== DASHBOARD TILE DEBUG =====");

    for (let i = 0; i < tilecount; i++) {

        try {

            const label = await tiles[i].$('ion-text');
            const text = await label.getText();

            console.log(`Tile ${i} -> ${text}`);

        } catch {

            console.log(`Tile ${i} -> (no label found)`);

        }
    }

    console.log("Total tiles detected:", tiles.length);
    console.log("===== END DASHBOARD DEBUG =====\n");
}
  async openModule(moduleName: string): Promise<void> {
    await this.clickTile(moduleName);
  }

}

export default new OperatorHomePage();