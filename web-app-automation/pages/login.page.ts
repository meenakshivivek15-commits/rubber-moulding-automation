import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly userId: Locator;
  readonly password: Locator;
  readonly companyId: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // ✅ locators MUST be initialized here
    this.userId = page.locator('input[placeholder="User ID"]');
    this.password = page.locator('input[placeholder="Password"]');
    this.companyId = page.locator('input[placeholder="Company Id"]');
    this.loginButton = page.getByRole('button', { name: /login/i });
  }

  async open() {
    await this.page.goto('/login');
  }

  async login() {
  await this.userId.fill(process.env.PPA_USER!);
  await this.password.fill(process.env.PPA_PASSWORD!);
  await this.companyId.fill(process.env.PPA_COMPANY!);
  await this.loginButton.click();
}

}
