import { test } from '@playwright/test';
import { LoginPage } from '../../../../pages/login.page';
import { SideMenuPage } from '../../../../pages/SideMenuPage';
import { RMQualityCheckPage } from '../../../../pages/Planner/purchase/Approval/rmQualityCheck.page';
import { readJson, writeJson } from '../../../../../common/utils/fileHelper';
import { verifyWebToast } from '../../../../Utils/toastUtils';


  const runtimePath = 'runtime/runtimeData.json';


test('TC_A3 - RM Quality Check (Dynamic Runtime)', async ({ page }) => {

  const loginPage = new LoginPage(page);
  const rmQC = new RMQualityCheckPage(page);
  const sideMenu = new SideMenuPage(page);
  const runtime = readJson(runtimePath);
  // ================= READ RUNTIME =================
  
  console.log("Runtime loaded:", runtime);
  console.log("GRN Date:", runtime.grnDate);
  console.log("GRN Time:", runtime.grnTime);
  console.log("PO Number:", runtime.poNumber);
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
  const grnId = await rmQC.openNewlyCreatedGRN(runtime);
  await Promise.all([
  verifyWebToast(page, 'Approval'),
  rmQC.submit()
]);
  // ================= SAVE GRN TO RUNTIME =================
  runtime.grnId = grnId;

  writeJson(runtimePath, runtime);

  console.log("Runtime updated with GRN ID:", runtime.grnId);

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
