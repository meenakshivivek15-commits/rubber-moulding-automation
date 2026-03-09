/// <reference types="@wdio/globals/types" />

import operatorHomePage from '../../pageobjects/common/operatorHome.page';
import goodsReceiptListPage from '../../pageobjects/purchase/goodsReceiptList.page';
import goodsReceiptFormPage from '../../pageobjects/purchase/goodsReceiptForm.page';

import allure from '@wdio/allure-reporter';

import { readJson, writeJson } from '../../../../common/utils/fileHelper';

import runtimeData from '../../../../common/test-data/runtime/runtimeData.json';
import mobileData from '../../data/goodsReceiptData.json';
import { verifyToast } from '../../../utils/toastUtils';
import { waitForElement } from '../../../utils/waitUtils';
import { ensureWebView } from '../../../utils/contextManager';
const runtimePath = 'runtime/runtimeData.json';
const operatorAppId = 'com.ppaoperator.app';
const runtime = readJson(runtimePath);

describe('Goods Receipt Flow', () => {


before(async () => {

    console.log("========= FRESH START =========");

    await driver.terminateApp(operatorAppId).catch(() => undefined);
    await driver.activateApp(operatorAppId);

    console.log("Waiting for WebView...");
    await ensureWebView();

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

    
    // ================= STEP 1 =================

    console.log("STEP 1: Navigate to GoodsReceipt module");

    await operatorHomePage.prepareDashboardForModule("GoodsReceipt");
    await operatorHomePage.openModule("GoodsReceipt");

    // ================= STEP 2 =================

    console.log("STEP 2: Select PO from list");

    await goodsReceiptListPage.selectPoFromList(runtimeData.poNumber);

    console.log("Selected PO:", runtimeData.poNumber);

    // ================= STEP 3 =================

    console.log("STEP 3: Wait for Goods Receipt Form");

    await goodsReceiptFormPage.waitForFormToLoad();

    // ================= STEP 4 =================

    console.log("STEP 4: Fill form fields");

    await goodsReceiptFormPage.selectLocation(mobileData.location);

    // Fill PO number
    await goodsReceiptFormPage.enterPoNumber(runtimeData.poNumber);
    await goodsReceiptFormPage.copyInvoiceDateFromLabel();

    await goodsReceiptFormPage.copyQuantityFromLabel();

    // Enter PIN
    await goodsReceiptFormPage.enterPin(mobileData.pin);

    runtime.grnStartTime = new Date().toISOString();
    writeJson(runtimePath, runtime);

   // ================= STEP 5 =================

    console.log("STEP 5: Submit Goods Receipt");

    console.log("Checking form values before submit...");

    await goodsReceiptFormPage.submit();

   // ================= STEP 6 =================

console.log("STEP 6: Capture success toast");

const toastText = await verifyToast("Updated");

console.log("Toast message:", toastText);

console.log("✅ Goods Receipt success toast validated");

const now = new Date();

runtime.grnDate = now.toLocaleDateString("en-GB");

runtime.grnTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
});

writeJson(runtimePath, runtime);

console.log("Captured GRN Date:", runtime.grnDate);
console.log("Captured GRN Time:", runtime.grnTime);

console.log("✅ Goods Receipt completed successfully");

});
});