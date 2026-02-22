import { Page, expect } from '@playwright/test';
import { SideMenuPage } from '../../../SideMenuPage';
import { BasePage } from '../../../BasePage';

export class ApprovalBasePage extends BasePage {

  readonly sideMenu: SideMenuPage;

  constructor(page: Page) {
    super(page);
    this.sideMenu = new SideMenuPage(page);
  }

  // =========================================================
  // OPEN APPROVAL PAGE FROM SIDE MENU
  // =========================================================
  async openApprovalFromMenu() {

    await this.sideMenu.openMenu();
    await this.sideMenu.clickMenuItem('Approval');

    // Ensure menu overlay is fully closed
    await this.closeSideMenuIfOpen();

    await expect(
      this.page.getByRole('heading', { name: /approvals/i })
    ).toBeVisible({ timeout: 15000 });

    console.log('Approval page opened');
  }

  // =========================================================
  // OPEN SPECIFIC APPROVAL CARD
  // =========================================================
  async openApprovalCard(cardName: string) {

    const card = this.page.locator('ion-card', {
      hasText: cardName,
    }).first();

    await expect(card).toBeVisible({ timeout: 15000 });

    // Close menu if it is still open (very important for Ionic)
    await this.closeSideMenuIfOpen();

    await card.click();

    console.log(`Approval card opened: ${cardName}`);
  }

  // =========================================================
  // CLOSE SIDE MENU IF OPEN
  // =========================================================
  private async closeSideMenuIfOpen() {

    const menu = this.page.locator('ion-menu.show-menu');

    if (await menu.count() > 0) {
      console.log('Side menu is open, closing...');

      await this.page.keyboard.press('Escape');

      await menu.waitFor({ state: 'hidden', timeout: 5000 });

      console.log('Side menu closed');
    }
  }
}
