export default class BasePage {

  async switchToWebView() {

    const contexts = await driver.getContexts() as string[];

    console.log("Available contexts:", contexts);

    await driver.pause(3000);

    const webview = contexts.find(c => c.includes('WEBVIEW'));

    if (!webview) {
        throw new Error("No WEBVIEW found");
    }

    await driver.switchContext(webview);

    const current = await driver.getContext();
    console.log("===== AFTER SWITCH =====");
    console.log("Current context:", current);

    await driver.pause(3000);
}

    async switchToNative() {
        await driver.switchContext('NATIVE_APP');
    }


    async ensureWebView() {

        const contexts = (await driver.getContexts()) as string[];

        const webview = contexts.find(ctx => ctx.includes('WEBVIEW'));

        if (!webview) {
            await this.switchToWebView();
        }
    }


    async safeClick(element: WebdriverIO.Element) {

        await element.waitForDisplayed({ timeout: 15000 });
        await element.waitForEnabled({ timeout: 15000 });
        await element.click();
    }


    async safeType(element: WebdriverIO.Element, value: string) {

        await element.waitForDisplayed({ timeout: 15000 });
        await element.setValue(value);
    }
}
