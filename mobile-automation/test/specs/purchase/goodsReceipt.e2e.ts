/// <reference types="@wdio/globals/types" />

import operatorHomePage from '../../pageobjects/common/operatorHome.page';
import goodsReceiptListPage from '../../pageobjects/purchase/goodsReceiptList.page';
import goodsReceiptFormPage from '../../pageobjects/purchase/goodsReceiptForm.page';

import allure from '@wdio/allure-reporter';

import { readJson, writeJson } from '../../../../common/utils/fileHelper';

import runtimeData from '../../../../common/test-data/runtime/runtimeData.json';
import mobileData from '../../data/goodsReceiptData.json';

const runtimePath = 'runtime/runtimeData.json';
const operatorAppId = 'com.ppaoperator.app';

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

            return count >= 6;

        }, { timeout: 60000 });

        console.log("✅ Dashboard loaded");

    });

    it(`should submit goods receipt for ${mobileData.location}`, async function () {

        this.timeout(600000);

        allure.addFeature('Purchase Process');
        allure.addStory('Goods Receipt Flow');

        const runtime = readJson(runtimePath);

        console.log("STEP 1: Navigate to GoodsReceipt module");

        await operatorHomePage.prepareDashboardForModule("GoodsReceipt");
        await operatorHomePage.openModule("GoodsReceipt");

        console.log("STEP 2: Select PO from list");

        await goodsReceiptListPage.selectPoFromList(runtimeData.poNumber);

        console.log("Selected PO:", runtimeData.poNumber);

        console.log("STEP 3: Wait for Goods Receipt Form");

        await goodsReceiptFormPage.waitForFormToLoad();

        console.log("STEP 4: Fill form fields");

        
        // Select location
        await goodsReceiptFormPage.selectLocation(mobileData.location);
        // Copy PO label → input field
       await goodsReceiptFormPage.enterPo(runtimeData.poNumber);

        // Enter PIN
        await goodsReceiptFormPage.enterPin(mobileData.pin);

        runtime.grnStartTime = new Date().toISOString();
        writeJson(runtimePath, runtime);

        console.log("STEP 5: Submit Goods Receipt");

        await goodsReceiptFormPage.submit();

        console.log("STEP 6: Validate success toast");

        const toast = await $('ion-toast');

        await toast.waitForExist({ timeout: 20000 });
        await toast.waitForDisplayed({ timeout: 20000 });

        const toastText = await toast.getText();

        console.log("Toast message:", toastText);

        await expect(toast).toBeDisplayed({ wait: 20000 });

        console.log("✅ Goods Receipt completed successfully");

    });

});