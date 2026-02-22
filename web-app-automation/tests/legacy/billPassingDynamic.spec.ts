import { test } from '@playwright/test';
import { LegacyLoginPage } from '../../pages/legacy/legacylogin.page';
import { LegacyHomePage } from '../../pages/legacy/dashboard.page';
import { BillPassingPage } from '../../pages/legacy/billPassing.page';
import { readJson } from '../../../common/utils/fileHelper';

const runtimePath = 'runtime/runtimeData.json';
const billData = readJson('legacy/billPassing.json').TC_A4;

test('TC_A4 - Bill Passing (Dynamic Runtime)', async ({ page }) => {

  const runtime = readJson(runtimePath);

  if (!runtime.poNumber) {
    throw new Error('PO Number missing in runtime data');
  }

  const loginPage = new LegacyLoginPage(page);
  const homePage = new LegacyHomePage(page);
  const billPassingPage = new BillPassingPage(page);

  // ================= LOGIN =================
  await loginPage.open();
  await loginPage.login(
    process.env.PPA_USER!,
    process.env.PPA_PASSWORD!
  );

  // ================= NAVIGATE =================
  await homePage.navigateToBillPassing();

  // Wait until PO appears in table
  await page.locator(`table tbody tr`, {
    has: page.locator('td', { hasText: runtime.poNumber })
  }).first().waitFor({ timeout: 20000 });

  // ================= APPROVE =================
  await billPassingPage.approveBillForPO(runtime.poNumber);

  // ================= POPUP =================
  await billPassingPage.waitForBillPassingPopup();
  await billPassingPage.confirmPopup(String(billData.taxRate));
  await billPassingPage.confirmFinalOk();

  // ================= VERIFY =================
  await billPassingPage.verifyPORemoved(runtime.poNumber);

  console.log(`Bill Passing completed for PO: ${runtime.poNumber}`);
});
