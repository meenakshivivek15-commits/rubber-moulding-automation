import { execSync } from 'child_process';

function runStep(name: string, command: string) {
  console.log(`\n==============================`);
  console.log(`🚀 STARTING: ${name}`);
  console.log(`==============================\n`);

  try {
    execSync(command, { stdio: 'inherit' });

    console.log(`\n✅ SUCCESS: ${name}\n`);
  } catch (error) {
    console.error(`\n❌ FAILED: ${name}`);
    process.exit(1);
  }
}

/*
|--------------------------------------------------------------------------
| CROSS PLATFORM ENTERPRISE FLOW
|--------------------------------------------------------------------------
| 1️⃣ Create PO (Planner)
| 2️⃣ Approve PO (Planner)
| 3️⃣ Goods Receipt (Mobile)
| 4️⃣ RM Quality Check (Planner)
| 5️⃣ Bill Passing (Legacy)
|--------------------------------------------------------------------------
*/

runStep(
  'Planner - Create PO',
  'cd web-app-automation && npx playwright test tests/planner/purchase/plan/purchaseorder.spec.ts --config=./config/playwright.qa.config.ts'
);

runStep(
  'Planner - PO Approval',
  'cd web-app-automation && npx playwright test tests/planner/purchase/approval/po-approval.spec.ts --config=./config/playwright.qa.config.ts'
);

runStep(
  'Mobile - Goods Receipt',
  'cd mobile-automation && npx wdio config/wdio.qa.conf.ts'
);

runStep(
  'Planner - RM Quality Check',
  'cd web-app-automation && npx playwright test tests/planner/purchase/approval/rmQualityCheck.spec.ts --config=./config/playwright.qa.config.ts'
);

runStep(
  'Legacy - Bill Passing',
  'cd web-app-automation && npx playwright test tests/legacy/billPassingDynamic.spec.ts --config=./config/playwright.qa.config.ts'
);

console.log(`
==========================================
🎉 FULL CROSS PLATFORM E2E FLOW COMPLETED
==========================================
`);
