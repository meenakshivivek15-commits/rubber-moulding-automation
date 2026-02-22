import { test } from '@playwright/test';
import { LoginPage } from '../../../../pages/login.page';
import { PlanBasePage } from '../../../../pages/Planner/purchase/Plan/planBase.page';
import { PurchaseOrderPage } from '../../../../pages/Planner/purchase/Plan/PurchaseOrder.page';
import poData from '../../../../../common/test-data/purchase/createPO.json';
import { readJson, writeJson } from '../../../../../common/utils/fileHelper';

const runtimePath = 'runtime/runtimeData.json';

test('Create Purchase Order', async ({ page }) => {

  const loginPage = new LoginPage(page);
  const planBase = new PlanBasePage(page);
  const poPage = new PurchaseOrderPage(page);

  // ================= LOGIN =================
  await loginPage.open();
  await loginPage.login();

  // ================= NAVIGATION =================
  await planBase.openPlan();
  await planBase.openPlanTile('Purchase');

  // ================= PURCHASE FLOW =================
  await poPage.selectAllMaterials();
await poPage.filterMaterial(poData.material);
await poPage.openCreatePOForMaterialAndGrade(poData);
await poPage.verifyCreatePOPopupOpened();
await poPage.fillMandatoryFieldsInCreatePO(poData);
await poPage.generatePO();


  const poNumber = await poPage.confirmRaisePO();

  console.log('Generated PO:', poNumber);

  // =========================================================
  // 🔥 UPDATE RUNTIME DATA FOR FULL CROSS-PLATFORM FLOW
  // =========================================================

  const runtime = readJson(runtimePath);

  runtime.poNumber = poNumber;
  runtime.supplier = poData.supplier;
  runtime.rmName = poData.material;      // material = RM name
  runtime.quantity = poData.quantity.toString(); // convert to string for matching

  writeJson(runtimePath, runtime);

  console.log('Runtime updated after PO creation:', runtime);
});
