import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async waitForUrlContains(text: string) {
    await this.page.waitForURL(`**${text}**`, { timeout: 15000 });
  }

  async waitForVisible(locatorText: string) {
    await expect(this.page.getByText(locatorText)).toBeVisible({ timeout: 15000 });
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }
}
