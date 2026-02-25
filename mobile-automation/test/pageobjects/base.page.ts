export default class BasePage {

    async switchToWebView(timeoutMs: number = 30000) {

        await driver.waitUntil(async () => {
            const contexts = await driver.getContexts();
            return contexts.some(c => String(c).includes('WEBVIEW'));
        }, {
            timeout: timeoutMs,
            interval: 1500,
            timeoutMsg: `WEBVIEW context not available within ${timeoutMs}ms`
        });

        const contexts = await driver.getContexts();
        const webview = contexts.find(c => String(c).includes('WEBVIEW'));

        if (!webview) {
            throw new Error("No WEBVIEW found after wait");
        }

        await driver.switchContext(webview);
        console.log("Switched to:", await driver.getContext());
    }

    async switchToNative() {
        await driver.switchContext('NATIVE_APP');
    }

    async ensureWebView(timeoutMs: number = 30000) {

       const currentContext = await driver.getContext();

if (!String(currentContext).includes('WEBVIEW')) {
    await this.switchToWebView(timeoutMs);
}
    }

    async safeClick(element: WebdriverIO.Element) {

        await element.waitForDisplayed({ timeout: 15000 });
        await element.waitForEnabled({ timeout: 15000 });

        try {
            await element.click();
        } catch {
            await driver.execute("arguments[0].click();", element);
        }
    }

    async safeType(element: WebdriverIO.Element, value: string) {

        await element.waitForDisplayed({ timeout: 15000 });
        await element.clearValue();
        await element.setValue(value);
    }
}