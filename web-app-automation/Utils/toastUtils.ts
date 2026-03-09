import { Page, expect } from '@playwright/test';

export async function verifyWebToast(
  page: Page,
  expectedText: string,
  selector: string = 'ion-toast'
) {

  const toast = page.locator(selector);

  await expect(toast).toBeVisible({ timeout: 15000 });

  const message = await toast.textContent();

  console.log('Web Toast message:', message);

  if (!message?.includes(expectedText)) {
    throw new Error(
      `Web toast validation failed. Expected: ${expectedText}, Actual: ${message}`
    );
  }

  return message;
}