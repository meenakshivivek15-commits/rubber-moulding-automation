export async function waitForToast() {
    const toast = await $('ion-toast');
    await toast.waitForDisplayed({ timeout: 10000 });
}
