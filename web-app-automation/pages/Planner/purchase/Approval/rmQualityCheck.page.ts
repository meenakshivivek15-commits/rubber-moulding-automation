import { expect } from '@playwright/test';
import { ApprovalBasePage } from './approvalBase.page';
import path from 'path';

export class RMQualityCheckPage extends ApprovalBasePage {

  // ================= OPEN RM QC CARD =================
  async openRMQualityCheckCard() {
    await this.openApprovalCard('Rm Quality Check');
  }

  // ================= WAIT FOR GRN TABLE =================
  async waitForGRNList() {

  await expect(
    this.page.getByRole('heading', { name: /rm quality check/i })
  ).toBeVisible({ timeout: 20000 });

  // Wait for any GRN ID cell to appear
  await this.page
    .locator('ion-col')
    .filter({ hasText: /\d{2}-\d{4}/ }) // matches 25-0106 format
    .first()
    .waitFor({ state: 'visible', timeout: 20000 });
}


  // ================= OPEN LATEST GRN (MOST STABLE METHOD) =================
  async openNewlyCreatedGRN(): Promise<string> {

  const firstGRNCell = this.page
    .locator('ion-col')
    .filter({ hasText: /\d{2}-\d{4}/ })
    .first();

  await firstGRNCell.waitFor({ state: 'visible', timeout: 20000 });

  const grnId = (await firstGRNCell.textContent())?.trim();

  if (!grnId) {
    throw new Error('GRN ID not found in first row');
  }

  await firstGRNCell.click();

  return grnId;
}


  // ================= FILL MANDATORY FIELDS =================
  async fillMandatoryFields(testCertRefValue: string, fileRelativePath: string) {

    const absolutePath = path.resolve(process.cwd(), fileRelativePath);

    console.log('Uploading file from:', absolutePath);

    const testCertRef = this.page
      .locator('text=Test Cert. Ref:')
      .locator('xpath=following::input[1]');

    await testCertRef.scrollIntoViewIfNeeded();
    await testCertRef.fill(testCertRefValue);

    const testCertUpload = this.page
      .locator('text=Test Cert. Upload:')
      .locator('xpath=following::input[@type="file"][1]');

    await testCertUpload.setInputFiles(absolutePath);

    const invoiceUpload = this.page
      .locator('text=Invoice Upload:')
      .locator('xpath=following::input[@type="file"][1]');

    await invoiceUpload.setInputFiles(absolutePath);
  }

  // ================= CLICK SUBMIT =================
  async submit() {
    const submitBtn = this.page.getByRole('button', { name: 'Submit' });

    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();
  }

  // ================= VERIFY SUCCESS =================
  async verifySuccess(grnId: string) {
    const toastMessage = this.page.getByText(
      new RegExp(`GRN\\s+${grnId}.*Completed`, 'i')
    );

    await expect(toastMessage).toBeVisible({ timeout: 10000 });
  }
}
