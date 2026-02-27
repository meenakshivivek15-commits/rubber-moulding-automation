import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

    // ===============================
    // 🔎 Locator
    // ===============================
    /*get goodsReceiptIcon() {
        // More stable than absolute XPath
        return $('//ion-img[contains(@ng-reflect-src,"receipt")]');
    }*/


    // ===============================
    // 🚀 Action
    // ===============================
 async openGoodsReceipt(): Promise<void> {

    console.log("\n===== OPENING GOODS RECEIPT MENU =====\n");

    // 1️⃣ Wait for WEBVIEW
    await driver.waitUntil(async () => {
        const contexts = await driver.getContexts();
        return contexts.some((ctx: any) =>
            ctx.toString().includes('WEBVIEW')
        );
    }, { timeout: 30000 });

    const contexts = await driver.getContexts();
    const webview = contexts.find((ctx: any) =>
        ctx.toString().includes('WEBVIEW')
    );

    if (!webview) {
        throw new Error("WEBVIEW context not found");
    }

    await driver.switchContext(webview as string);
    console.log("Switched to:", webview);

    await driver.pause(3000);

    // 2️⃣ Use your absolute XPath
    const receiptTile = await $(
        '//*[@id="main"]/app-home/ion-content[2]/ion-grid/ion-row/div[23]/ion-col/ion-img'
    );

    await receiptTile.waitForDisplayed({ timeout: 30000 });

    console.log("GoodsReceipt tile found using absolute XPath");

    await receiptTile.click();

    console.log("Clicked GoodsReceipt tile");

    // 3️⃣ Wait for navigation
    await driver.waitUntil(async () => {
        const url = await driver.execute(() => window.location.href);
        console.log("Current URL:", url);
        return !url.includes('/home');
    }, {
        timeout: 20000,
        interval: 1000,
        timeoutMsg: "Navigation did not happen"
    });

    // 4️⃣ Confirm list page
    const grid = await $('//*[@id="grid"]');
    await grid.waitForDisplayed({ timeout: 30000 });

    console.log("Goods Receipt list page loaded");
}
}
export default new OperatorHomePage();