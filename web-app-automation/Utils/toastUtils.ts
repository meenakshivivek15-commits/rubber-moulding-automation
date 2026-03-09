import { Page } from '@playwright/test';

export async function verifyWebToast(page: Page, expectedText: string) {

  const toast = page.locator('.toast-message');

  await page.waitForSelector('.toast-message', { timeout: 15000 });

  const message = await toast.first().textContent();

  console.log("Toast message:", message);

  if (!message?.includes(expectedText)) {
    throw new Error(
      `Toast validation failed. Expected text: ${expectedText}, Actual: ${message}`
    );
  }

  return message;
}