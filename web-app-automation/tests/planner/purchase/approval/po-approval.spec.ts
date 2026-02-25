import { test } from '@playwright/test';
import { readJson } from '../../../../../common/utils/fileHelper';
import { writeJson } from '../../../../../common/utils/fileHelper';
import { PlanBasePage } from '../../../../pages/Planner/purchase/Plan/planBase.page';
import { PurchaseOrderPage } from '../../../../pages/Planner/purchase/Plan/PurchaseOrder.page';
import poData from '../../../../../common/test-data/purchase/createPO.json';

import { LoginPage } from '../../../../pages/login.page';
import { ApprovalBasePage } from '../../../../pages/Planner/purchase/Approval/approvalBase.page';
import { POApprovalPage } from '../../../../pages/Planner/purchase/Approval/POApprovalpage';

test('Approve Created PO (Dynamic)', async ({ page }) => {
  test.setTimeout(240000);

  const loginPage = new LoginPage(page);
  const approvalBase = new ApprovalBasePage(page);
  const poApproval = new POApprovalPage(page);
  const planBase = new PlanBasePage(page);
  const poPage = new PurchaseOrderPage(page);
  const runtimePath = 'runtime/runtimeData.json';

  // 🔥 Read dynamically created PO
  const runtimeData = readJson(runtimePath);
  let poNumber = runtimeData.poNumber;

  // 1️⃣ Login
  await loginPage.open();
  await loginPage.login();

  // 2️⃣ Navigate to Approval → Purchase Order
  await approvalBase.openApprovalFromMenu();
  await approvalBase.openApprovalCard('Purchase Order');

  // 3️⃣ Open PO dynamically
  try {
    await poApproval.openPO(poNumber);
  } catch (error) {
    console.log(`PO ${poNumber} not available in Approval queue. Creating a fresh PO...`);

    await planBase.openPlan();
    await planBase.openPlanTile('Purchase');
    await poPage.selectAllMaterials();
    await poPage.filterMaterial(poData.material);
    await poPage.openCreatePOForMaterialAndGrade(poData);
    await poPage.verifyCreatePOPopupOpened();
    await poPage.fillMandatoryFieldsInCreatePO(poData);
    await poPage.generatePO();

    poNumber = await poPage.confirmRaisePO();

    const runtime = readJson(runtimePath);
    runtime.poNumber = poNumber;
    runtime.supplier = poData.supplier;
    runtime.rmName = poData.material;
    runtime.quantity = poData.quantity.toString();
    writeJson(runtimePath, runtime);

    console.log(`Created fallback PO for approval: ${poNumber}`);

    await approvalBase.openApprovalFromMenu();
    await approvalBase.openApprovalCard('Purchase Order');
    await poApproval.openPO(poNumber);
  }

  // 4️⃣ Approve PO
  await poApproval.approvePO(
    poNumber,
    'Approved',
    'Auto approval by automation'
  );
});
