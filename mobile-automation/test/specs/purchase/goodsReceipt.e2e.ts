/// <reference types="@wdio/globals/types" />

import operatorHomePage from '../../pageobjects/common/operatorHome.page';
import goodsReceiptListPage from '../../pageobjects/purchase/goodsReceiptList.page';
import goodsReceiptFormPage from '../../pageobjects/purchase/goodsReceiptForm.page';
import allure from '@wdio/allure-reporter';
import { readJson, writeJson } from '../../../../common/utils/fileHelper';

// ===== Runtime Path =====
const runtimePath = 'runtime/runtimeData.json';
const operatorAppId = 'com.ppaoperator.app';

// ===== Static mobile test data =====
const mobileData = require('../../data/goodsReceiptData.json');



describe('Goods Receipt Flow', () => {
   const getCurrentPackageName = async (): Promise<string> => {
    const packageName = await driver.execute('mobile: getCurrentPackage');
    return String(packageName || 'unknown');
   };

   const ensureOperatorAppForeground = async (attempts: number = 4): Promise<void> => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        const currentPackage = await getCurrentPackageName();
        console.log(`Current package (attempt ${attempt}/${attempts}): ${currentPackage}`);

        if (currentPackage === operatorAppId) {
            return;
        }

        await driver.activateApp(operatorAppId);
        await browser.pause(4000);
    }

    const finalPackage = await getCurrentPackageName();
    throw new Error(`Operator app is not foreground after retries. Current package: ${finalPackage}`);
   };

   before(async () => {

    console.log("========= FRESH START: OPERATOR APP =========");

    try {
        await driver.execute('mobile: clearApp', { appId: operatorAppId });
        console.log('Cleared operator app state for fresh run');
    } catch {
        console.log('mobile: clearApp not available; continuing with clean restart');
    }

    // 🔥 Proper clean restart (keeps settings because noReset=true)
    await driver.terminateApp(operatorAppId).catch(() => undefined);
    await driver.activateApp(operatorAppId);

    await browser.pause(5000);
    await ensureOperatorAppForeground();

    const currentPackage = await getCurrentPackageName();
    console.log("🔥 CURRENT PACKAGE:", currentPackage);

    console.log("===========================================");
});

    it(`should submit goods receipt for ${mobileData.location}`, async function () {
        this.timeout(600000);

        // ===== Allure Metadata =====
        allure.addFeature('Purchase Process');
        allure.addStory('Goods Receipt Flow');
        allure.addSeverity('critical');

        // ===== Read PO created from Web =====
        const runtime = readJson(runtimePath);

        if (!runtime.poNumber) {
            throw new Error('PO number missing in runtime data');
        }

        console.log(`Using PO: ${runtime.poNumber}`);

        // ===== Navigate to Goods Receipt =====
        await operatorHomePage.openGoodsReceipt();

        // 🔥 IMPORTANT: Backend Sync Buffer
        console.log('After clicking Goods Receipt');
        console.log('Waiting for backend sync...');
        await browser.pause(12000);

        // ===== Select PO from Native List =====
        await goodsReceiptListPage.selectPoFromList(runtime.poNumber);

        // ===== Switch to WebView =====
        await goodsReceiptFormPage.switchToWebView();

        // ===== Fill Form =====
        await goodsReceiptFormPage.selectLocation(mobileData.location);
        await goodsReceiptFormPage.enterPoNumber(runtime.poNumber);
        await goodsReceiptFormPage.enterPin(mobileData.pin);

        // 🔥 Save GRN timestamp BEFORE submission
        runtime.grnStartTime = new Date().toISOString();
        writeJson(runtimePath, runtime);

        console.log('Saved GRN start time:', runtime.grnStartTime);

        // ===== Submit =====
        await goodsReceiptFormPage.submit();
        console.log('After submit clicked');
        // ===== Validate Success Toast =====
        const toast = await $('ion-toast');
        await toast.waitForDisplayed({ timeout: 15000 });

        const toastMessage = await toast.getText();
        console.log('Toast Message:', toastMessage);

        await expect(toast).toBeDisplayed();

        console.log('Goods Receipt completed successfully');
    });

});
