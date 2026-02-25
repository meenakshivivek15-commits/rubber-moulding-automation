import BasePage from '../base.page';

class OperatorHomePage extends BasePage {

   async openGoodsReceipt(): Promise<void> {

    console.log("\n===== OPENING GOODS RECEIPT MENU =====\n");

    await this.switchToWebView(90000);

    const receiptTile = await $('//ion-img[contains(@ng-reflect-src,"receipt")]');
    await receiptTile.waitForDisplayed({ timeout: 30000 });

    await receiptTile.click();

    const grid = await $('#grid');
    await grid.waitForDisplayed({ timeout: 30000 });

    console.log("Goods Receipt list page loaded successfully");
}
}

export default new OperatorHomePage();