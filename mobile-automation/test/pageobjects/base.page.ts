export default class BasePage {

    private async getStableWebviewContext(minConsecutiveHits: number = 2, timeoutMs: number = 30000): Promise<string> {
        let candidate = '';
        let streak = 0;

        await driver.waitUntil(async () => {
            const contexts = (await driver.getContexts()).map(String);
            const webview = contexts.find((context) => context.startsWith('WEBVIEW'));

            if (!webview) {
                candidate = '';
                streak = 0;
                return false;
            }

            if (webview === candidate) {
                streak += 1;
            } else {
                candidate = webview;
                streak = 1;
            }

            return streak >= minConsecutiveHits;
        }, {
            timeout: timeoutMs,
            interval: 1200,
            timeoutMsg: `WEBVIEW context not stable within ${timeoutMs}ms`
        });

        return candidate;
    }

    async switchToWebView(timeoutMs: number = 30000) {
        let lastError: unknown;
        const startedAt = Date.now();

        for (let attempt = 1; attempt <= 6; attempt++) {
            try {
                const remainingMs = Math.max(5000, timeoutMs - (Date.now() - startedAt));
                const webview = await this.getStableWebviewContext(2, remainingMs);
                const contexts = (await driver.getContexts()).map(String);

                console.log(`Available contexts (attempt ${attempt}):`, contexts);

                if (!contexts.includes(webview)) {
                    throw new Error(`Stable WEBVIEW ${webview} vanished before switch`);
                }

                await driver.switchContext(webview);
                await driver.pause(1000);

                const currentContext = await driver.getContext();
                if (!String(currentContext).includes('WEBVIEW')) {
                    throw new Error(`Context switched but still not in WEBVIEW. Current: ${currentContext}`);
                }

                await driver.execute(() => document.readyState);

                console.log('Switched to:', currentContext);
                return;
            } catch (error) {
                lastError = error;

                const errorMessage = error instanceof Error ? error.message : String(error);
                if (/No such context found|disconnected|Inspector\.detached|Session ID is not set/i.test(errorMessage)) {
                    await this.switchToNative().catch(() => undefined);
                    await driver.pause(1500);
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