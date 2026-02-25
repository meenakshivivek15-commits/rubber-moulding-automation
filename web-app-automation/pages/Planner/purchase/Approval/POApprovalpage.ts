import { Page, expect } from '@playwright/test';
import {SideMenuPage } from '../../../SideMenuPage';
export class POApprovalPage {
  readonly page: Page;
  private sideMenu: SideMenuPage;

  constructor(page: Page) {
    this.page = page;
    this.sideMenu = new SideMenuPage(page);
  }

  // ================= OPEN APPROVAL LIST =================
  async openApprovalList() {
    await this.sideMenu.openMenu();
    await this.sideMenu.clickMenuItem('Approval');
    await this.sideMenu.clickMenuItem('Purchase Order');

    await expect(
      this.page.getByText('Purchase Order')
    ).toBeVisible({ timeout: 15000 });
  }

  // ================= SEARCH & OPEN PO =================
  async openPO(poId: string) {

    const searchInput = this.page.locator('input[placeholder="Search"]');
    const escapedPoId = poId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const poLink = this.page.getByText(new RegExp(`\\b${escapedPoId}\\b`)).first();
    const timeoutMs = 25000;
    const pollIntervalMs = 2000;
    const endTime = Date.now() + timeoutMs;

    await expect(searchInput).toBeVisible({ timeout: 15000 });

    console.log(`Searching PO: ${poId}`);

    while (Date.now() < endTime) {
      await searchInput.fill('');
      await searchInput.fill(poId);
      await searchInput.press('Enter').catch(() => undefined);

      await this.page.waitForTimeout(pollIntervalMs);

      if (await poLink.isVisible().catch(() => false)) {
        break;
      }
    }

    if (!(await poLink.isVisible().catch(() => false))) {
      const visiblePoIds = (await this.page
        .locator('ion-col')
        .filter({ hasText: /\b\d{2}[A-Z]{2}\d{4}\b/ })
        .allTextContents())
        .map((text) => text.trim())
        .slice(0, 10)
        .join(', ');

      throw new Error(
        `PO ${poId} not visible in Approval list after ${timeoutMs / 1000}s. Visible PO samples: ${visiblePoIds || 'none'}`
      );
    }

    await poLink.click();

    console.log(`Opened PO: ${poId}`);
  }

  // ================= APPROVE / REJECT =================
  async approvePO(
    poId: string,
    decision: 'Approved' | 'Rejected',
    remarks: string
  ) {

    if (!remarks || remarks.trim().length === 0) {
      throw new Error(`Remarks is mandatory for ${decision} decision`);
    }

    // 1️⃣ Confirm correct popup
    const popupHeader = this.page.getByText(`PO ID : ${poId}`, { exact: true });
    await expect(popupHeader).toBeVisible({ timeout: 15000 });

    // 2️⃣ Select Approved / Rejected
    await this.page.getByText(decision, { exact: true }).click();

    // 3️⃣ Enter remarks
    const remarksBox = this.page.locator('textarea[placeholder="Remarks"]');
    await expect(remarksBox).toBeVisible({ timeout: 15000 });
    await remarksBox.fill(remarks);

    // 4️⃣ Submit
    const submitButton = this.page.getByRole('button', { name: /submit/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // 5️⃣ Wait until PO disappears from list
    await expect(
      this.page.getByText(poId, { exact: true })
    ).not.toBeVisible({ timeout: 20000 });

    console.log(`${decision} PO: ${poId}`);
  }
}
