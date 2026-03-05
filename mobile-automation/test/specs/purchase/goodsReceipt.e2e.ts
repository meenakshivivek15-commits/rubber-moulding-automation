/// <reference types="@wdio/globals/types" />

import operatorHomePage from '../../pageobjects/common/operatorHome.page';
import goodsReceiptListPage from '../../pageobjects/purchase/goodsReceiptList.page';
import goodsReceiptFormPage from '../../pageobjects/purchase/goodsReceiptForm.page';
import allure from '@wdio/allure-reporter';
import { readJson, writeJson } from '../../../../common/utils/fileHelper';

const runtimePath = 'runtime/runtimeData.json';
const operatorAppId = 'com.ppaoperator.app';

const mobileData = require('../../data/goodsReceiptData.json');

describe('Goods Receipt Flow', () => {

 before(async () => {

    console.log("========= FRESH START =========");

    await driver.terminateApp(operatorAppId).catch(() => undefined);
    await driver.activateApp(operatorAppId);

    console.log("Waiting for WebView...");

    await operatorHomePage.ensureWebView(90000);

    console.log("Waiting for dashboard tiles...");

    await browser.waitUntil(async () => {

        const tiles = await $$('ion-img');
        const count = await tiles.length;

        console.log("Tile count:", count);

        return count > 5;

    }, { timeout: 60000 });

    console.log("Dashboard loaded");

});
    it(`should submit goods receipt for ${mobileData.location}`, async function () {

        this.timeout(600000);

        allure.addFeature('Purchase Process');
        allure.addStory('Goods Receipt Flow');

        const runtime = readJson(runtimePath);
        const tiles = await $$('ion-img');
        console.log("Detected tiles on home:", tiles.length);
        console.log("STEP 1: Navigate to Goods Receipt");
          await browser.pause(5000);  
        await operatorHomePage.printAllTiles();
        await operatorHomePage.debugDashboard();
       await operatorHomePage.clickTile("GoodsReceipt");
       
        console.log("STEP 2: Select PO");
        const selectedPo = await goodsReceiptListPage.selectPoFromList(mobileData.poNumber);
        console.log("Selected PO:", mobileData.poNumber);

        console.log("STEP 3: Wait for Form");
        await goodsReceiptFormPage.waitForFormToLoad();

        console.log("STEP 4: Fill Form");
        await goodsReceiptFormPage.selectLocation(mobileData.location);
        await goodsReceiptFormPage.syncInvoiceDateFromLabel();
        await goodsReceiptFormPage.enterPin(mobileData.pin);

        runtime.grnStartTime = new Date().toISOString();
        writeJson(runtimePath, runtime);

        console.log("STEP 5: Submit");
        await goodsReceiptFormPage.submit();

        const toast = await $('ion-toast');
        await toast.waitForExist({ timeout: 20000 });
        await toast.waitForDisplayed({ timeout: 20000 });   
        console.log("Toast:", await toast.getText());

        await expect(toast).toBeDisplayed({ wait: 20000 });

        console.log("✅ Goods Receipt completed successfully");
    });
});