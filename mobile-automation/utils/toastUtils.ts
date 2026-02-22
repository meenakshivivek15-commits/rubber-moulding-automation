/// <reference types="@wdio/globals/types" />

export async function waitForToast(
    selector: string = 'ion-toast',
    timeout: number = 10000
) {
    const toast = await $(selector);

    await toast.waitForDisplayed({ timeout });

    const message = await toast.getText();

    console.log('Toast message:', message);

    return message;
}

export async function verifyToast(
    expectedText: string,
    selector: string = 'ion-toast'
) {
    const message = await waitForToast(selector);

    if (!message.includes(expectedText)) {
        throw new Error(
            `Toast validation failed. Expected: ${expectedText}, Actual: ${message}`
        );
    }

    console.log('Toast verified:', message);

    return message;
}
