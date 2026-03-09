/// <reference types="@wdio/globals/types" />

export async function waitForElement(
  selector: string,
  timeout: number = 10000
) {
  const element = await $(selector);

  await element.waitForDisplayed({ timeout });

  return element;
}

export async function pause(seconds: number) {
  await browser.pause(seconds * 1000);
}