import { Page } from '@playwright/test';

export class LegacyHomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToBillPassing() {

    // Hover on Mixing (NOT click)
    await this.page.locator('div.item:has-text("Mixing")').hover();

    // Wait for Purchase to appear
    await this.page.locator('a:has-text("Purchase")')
      .waitFor({ state: 'visible', timeout: 10000 });

    // Hover on Purchase (if it also expands)
    await this.page.locator('a:has-text("Purchase")').hover();

    // Click Bill Passing
    await this.page.locator('a[href="/Mixing/BillPassing"]').click();
  }
}
