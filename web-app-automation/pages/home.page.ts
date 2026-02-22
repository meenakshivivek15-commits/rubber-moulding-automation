import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly menuButton: Locator;
  readonly planMenu: Locator;

  constructor(page: Page) {
    this.page = page;

    // hamburger menu (ionic)
    this.menuButton = page.locator('ion-menu-button');

    // menu item
    this.planMenu = page.getByText('Plan', { exact: true });
  }

  async verifyHomePage() {
    await expect(
      this.page.getByRole('heading', { name: /home/i })
    ).toBeVisible();
  }

  async openPlanFromMenu() {
    await this.menuButton.click();
    await this.planMenu.click();
  }
  // SAFE ADD – does not affect existing tests
async openOperatorMenu() {
  await this.menuButton.click();
  await this.page.getByText('Operator', { exact: true }).click();
}

}
