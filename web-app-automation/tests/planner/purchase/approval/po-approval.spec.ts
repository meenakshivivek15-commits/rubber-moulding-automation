import { test } from '@playwright/test';
import { readJson } from '../../../../../common/utils/fileHelper';

import { LoginPage } from '../../../../pages/login.page';
import { ApprovalBasePage } from '../../../../pages/Planner/purchase/Approval/approvalBase.page';
import { POApprovalPage } from '../../../../pages/Planner/purchase/Approval/POApprovalpage';

test('Approve Created PO (Dynamic)', async ({ page }) => {

  const loginPage = new LoginPage(page);
  const approvalBase = new ApprovalBasePage(page);
  const poApproval = new POApprovalPage(page);

  // 🔥 Read dynamically created PO
  const runtimeData = readJson('runtime/runtimeData.json');
  const poNumber = runtimeData.poNumber;

  // 1️⃣ Login
  await loginPage.open();
  await loginPage.login();

  // 2️⃣ Navigate to Approval → Purchase Order
  await approvalBase.openApprovalFromMenu();
  await approvalBase.openApprovalCard('Purchase Order');

  // 3️⃣ Open PO dynamically
  await poApproval.openPO(poNumber);

  // 4️⃣ Approve PO
  await poApproval.approvePO(
    poNumber,
    'Approved',
    'Auto approval by automation'
  );
});
