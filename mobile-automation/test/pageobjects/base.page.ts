export default class BasePage {

    async switchToWebView(timeoutMs: number = 30000) {

        let stableWebview: string | undefined;

        await driver.waitUntil(async () => {
            const contexts = await driver.getContexts();
            const webviews = contexts.filter(c => String(c).includes('WEBVIEW')).map(String);

            if (webviews.length === 0) {
                stableWebview = undefined;
                return false;
            }

            if (stableWebview === webviews[0]) {
                return true;
            }

            stableWebview = webviews[0];
            return false;
        }, {
            timeout: timeoutMs,
            interval: 1500,
            timeoutMsg: `WEBVIEW context not available within ${timeoutMs}ms`
        });

        let lastError: unknown;

        for (let attempt = 1; attempt <= 4; attempt++) {
            try {
                const contexts = await driver.getContexts();
                const webview = stableWebview || contexts.find(c => String(c).includes('WEBVIEW'));

                console.log(`Available contexts (attempt ${attempt}):`, contexts);

                if (!webview) {
                    throw new Error('No WEBVIEW found after wait');
                }

                await driver.switchContext(webview);
                await driver.pause(1200);

                const currentContext = await driver.getContext();
                if (!String(currentContext).includes('WEBVIEW')) {
                    throw new Error(`Context switched but still not in WEBVIEW. Current: ${currentContext}`);
                }

                console.log('Switched to:', currentContext);
                return;
            } catch (error) {
                lastError = error;

                const errorMessage = error instanceof Error ? error.message : String(error);
                if (/Session ID is not set/i.test(errorMessage)) {
                    throw new Error('Appium session became invalid during WEBVIEW attach.');
                }

                console.log(`WebView attach attempt ${attempt} failed, retrying...`);
                await driver.pause(1500);
            }
        }

        throw lastError instanceof Error
            ? lastError
            : new Error('Unable to attach stable WEBVIEW context');
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