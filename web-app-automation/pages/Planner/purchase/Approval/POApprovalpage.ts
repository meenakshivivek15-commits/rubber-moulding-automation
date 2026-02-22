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

    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill(poId);

    console.log(`Searching PO: ${poId}`);

    const poLink = this.page.getByText(poId, { exact: true });

    await expect(poLink).toBeVisible({ timeout: 20000 });
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
