import { Page, expect } from '@playwright/test';

export async function verifyWebToast(
  page: Page,
  expectedText: string
) {

  const toast = page.locator('ion-toast');

  // wait for toast to appear
  await expect(toast).toBeVisible({ timeout: 15000 });

  // capture the real message from UI
  const message = await toast.locator('.toast-message').textContent();

  console.log('Web Toast message:', message);

  if (!message?.includes(expectedText)) {
    throw new Error(
      `Web toast validation failed. Expected: ${expectedText}, Actual: ${message}`
    );
  }

  return message;
}