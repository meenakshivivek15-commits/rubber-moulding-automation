const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const flowStateDir = path.resolve(__dirname, '../.github/tmp');
const flowStateFile = path.join(flowStateDir, 'full-flow-state.json');

function writeFlowState(data: Record<string, unknown>) {
  if (!fs.existsSync(flowStateDir)) {
    fs.mkdirSync(flowStateDir, { recursive: true });
  }

  fs.writeFileSync(flowStateFile, JSON.stringify(data, null, 2));
}

function runStep(stepName: string, command: string) {
  console.log('\n======================================');
  console.log(`🚀 STARTING: ${stepName}`);
  console.log('======================================\n');

  writeFlowState({
    status: 'running',
    step: stepName,
    command,
    timestamp: new Date().toISOString()
  });

  try {
    execSync(command, { stdio: 'inherit' });

    console.log('\n======================================');
    console.log(`✅ COMPLETED: ${stepName}`);
    console.log('======================================\n');
  } catch (error) {
    writeFlowState({
      status: 'failed',
      step: stepName,
      command,
      timestamp: new Date().toISOString()
    });

    console.error('\n======================================');
    console.error(`❌ FAILED: ${stepName}`);
    console.error('======================================\n');
    process.exit(1);
  }
}

// ======================================
// FULL BUSINESS FLOW (CORRECT ORDER)
// ======================================

// 1️⃣ CREATE PO
runStep(
  'Planner - Create PO',
  'cd web-app-automation && npx playwright test tests/planner/purchase/plan/purchaseorder.spec.ts --config=config/playwright.qa.config.ts'
);

// 2️⃣ APPROVE PO
runStep(
  'Planner - Approve PO',
  'cd web-app-automation && npx playwright test tests/planner/purchase/approval/po-approval.spec.ts --config=config/playwright.qa.config.ts'
);

// 3️⃣ GOODS RECEIPT (EMULATOR)
runStep(
  'Mobile - Goods Receipt (Emulator)',
  'cd mobile-automation && cross-env DEVICE=emulator npx wdio run config/wdio.qa.conf.ts'
);

// 4️⃣ RM QUALITY CHECK
runStep(
  'Planner - RM Quality Check',
  'cd web-app-automation && npx playwright test tests/planner/purchase/approval/rmQualityCheck.spec.ts --config=config/playwright.qa.config.ts'
);

// 5️⃣ BILL PASSING
runStep(
  'Planner - Bill Passing',
  'cd web-app-automation && npx playwright test tests/legacy/billPassingDynamic.spec.ts --config=config/playwright.qa.config.ts'
);

console.log('\n🎉 FULL BUSINESS FLOW COMPLETED SUCCESSFULLY\n');
writeFlowState({
  status: 'passed',
  step: 'all',
  timestamp: new Date().toISOString()
});
process.exit(0);
