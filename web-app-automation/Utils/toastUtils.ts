import { Page } from '@playwright/test';

export async function verifyWebToast(page: Page, expectedText: string) {

  const toast = page.locator(`text=${expectedText}`);

  await page.waitForSelector(`text=${expectedText}`, { timeout: 15000 });

  const message = await toast.first().textContent();

  console.log("Toast message:", message);

  return message;
}