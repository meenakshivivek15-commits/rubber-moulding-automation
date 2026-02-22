import { Page, expect } from '@playwright/test';

export class LegacyLoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------- Open Legacy URL ----------
  async open() {
    await this.page.goto(process.env.LEGACY_URL!);
  }

  // ---------- Login Method ----------
  async login(username: string, password: string) {
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }

  // ---------- Verify Successful Login ----------
  async verifyLoginSuccess() {
    await expect(this.page).not.toHaveURL(/login/i);
  }
}
