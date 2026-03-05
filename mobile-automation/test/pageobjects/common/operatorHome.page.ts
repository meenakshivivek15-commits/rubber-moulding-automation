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

    await this.ensureWebView(90000);
    await this.ensureTilesVisible();
    console.log(`STEP: Navigate to ${tileName}`);

    await this.scrollUntilModuleVisible(tileName);

    const label = await $(`//ion-text[normalize-space()='${tileName}']`);

    if (!(await label.isExisting())) {
        throw new Error(`${tileName} module not found on dashboard`);
    }

    const tile = await label.$('./ancestor::ion-col//ion-img');

    await this.safeClick(tile);

    console.log(`${tileName} tile clicked`);
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
    const tileCount = await tiles.length;

    console.log("\n===== DASHBOARD TILE DEBUG =====");
    console.log("Total dashboard tiles found:", tileCount);

    for (let i = 0; i < tileCount; i++) {

        try {

            const label = await tiles[i].$('ion-text');
            const text = (await label.getText()).trim();

            if (text.length > 0) {
                console.log(`Tile ${i} -> ${text}`);
            } else {
                console.log(`Tile ${i} -> (empty label)`);
            }

        } catch {

            console.log(`Tile ${i} -> (no label found)`);

        }
    }

    console.log("===== END DASHBOARD DEBUG =====\n");
}
async scrollUntilModuleVisible(tileName: string): Promise<void> {

    let previousCount = 0;
    let sameCountAttempts = 0;

    for (let i = 0; i < 20; i++) {

        const labels = await $$('ion-text');
        const currentCount = await labels.length;

        console.log(`Visible modules: ${currentCount}`);

        // check if module already visible
        for (const label of labels) {

            const text = (await label.getText()).trim();

            if (text === tileName) {
                console.log(`${tileName} module detected`);
                return;
            }
        }

        // detect bottom of dashboard
        if (currentCount === previousCount) {
            sameCountAttempts++;
        } else {
            sameCountAttempts = 0;
        }

        if (sameCountAttempts >= 2) {
            console.log("Reached dashboard bottom");
            break;
        }

        previousCount = currentCount;

        console.log("Scrolling dashboard...");

        await this.scrollDashboard();

        await browser.pause(1500);
    }
}
async buildModuleMap(): Promise<Map<string, ChainablePromiseElement>> {

    const moduleMap = new Map<string, ChainablePromiseElement>();
    for (let i = 0; i < 20; i++) {

        const labels = await $$('ion-text');

        for (const label of labels) {

            const text = (await label.getText()).trim();

            if (text.length > 0 && !moduleMap.has(text)) {

                const tile = label.$('./ancestor::ion-col//ion-img');

                moduleMap.set(text, tile);

                console.log(`Mapped module: ${text}`);
            }
        }

        const currentCount = moduleMap.size;

        await this.scrollDashboard();
        await browser.pause(1200);

        const labelsAfter = await $$('ion-text');
        const count = await labelsAfter.length;
        if (count <= currentCount) {
            break;
        }
    }

    console.log(`Total modules mapped: ${moduleMap.size}`);

    return moduleMap;
}
  async openModule(tileName: string): Promise<void> {

    await this.ensureWebView(90000);

    const moduleMap = await this.buildModuleMap();

    if (!moduleMap.has(tileName)) {
        throw new Error(`Module not found: ${tileName}`);
    }

    const tile = moduleMap.get(tileName)!;

    await this.safeClick(tile);

    console.log(`${tileName} tile clicked`);
}

}

export default new OperatorHomePage();