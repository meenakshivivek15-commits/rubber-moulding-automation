import { Page, Locator, expect } from '@playwright/test';

export class SideMenuPage {
  readonly page: Page;
  readonly hamburger: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hamburger = page.locator('ion-menu-button');
  }

  async openMenu() {
    await expect(this.hamburger).toBeVisible({ timeout: 15000 });
    await this.hamburger.click();
  }

  async clickMenuItem(menuName: string) {
    const menuItem = this.page.getByText(menuName, { exact: true });
    await expect(menuItem).toBeVisible({ timeout: 15000 });
    await menuItem.click();
  }
}
