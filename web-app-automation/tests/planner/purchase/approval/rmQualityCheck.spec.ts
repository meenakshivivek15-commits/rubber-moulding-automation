import { test } from '@playwright/test';
import { LoginPage } from '../../../../pages/login.page';
import { SideMenuPage } from '../../../../pages/SideMenuPage';
import { RMQualityCheckPage } from '../../../../pages/Planner/purchase/Approval/rmQualityCheck.page';
import { readJson, writeJson } from '../../../../../common/utils/fileHelper';

const runtimePath = 'runtime/runtimeData.json';

test('TC_A3 - RM Quality Check (Dynamic Runtime)', async ({ page }) => {

  const loginPage = new LoginPage(page);
  const rmQC = new RMQualityCheckPage(page);
  const sideMenu = new SideMenuPage(page);

  // ================= READ RUNTIME =================
  const runtime = readJson(runtimePath);

  // ================= LOGIN =================
  await loginPage.open();
  await loginPage.login();

  // ================= NAVIGATION =================
  await sideMenu.openMenu();
  await sideMenu.clickMenuItem('Approval');

  await rmQC.openRMQualityCheckCard();
  await rmQC.waitForGRNList();

  // Small backend buffer (important for async DB update)
  await page.waitForTimeout(5000);

  // ================= OPEN LATEST GRN =================
  const grnId = await rmQC.openNewlyCreatedGRN();

  console.log('Captured GRN ID:', grnId);

  // ================= SAVE GRN TO RUNTIME =================
  runtime.grnId = grnId;
  writeJson(runtimePath, runtime);

  // ================= FILL FORM =================
  await rmQC.fillMandatoryFields(
    'AUTO_CERT_001',
    'tests/testFiles/sample.pdf'
  );

  // ================= SUBMIT =================
  await rmQC.submit();

  // ================= VERIFY =================
  await rmQC.verifySuccess(grnId);

});
