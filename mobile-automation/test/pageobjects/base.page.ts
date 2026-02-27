export default class BasePage {

    protected isSessionTerminatedError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        return /A session is either terminated or not started|invalid session id|Session ID is not set/i.test(message);
    }

    private hasActiveSession(): boolean {
        return Boolean(driver.sessionId);
    }

    async switchToWebView(timeoutMs: number = 30000) {
        let lastError: unknown;

        for (let attempt = 1; attempt <= 6; attempt++) {
            if (!this.hasActiveSession()) {
                throw new Error('Appium session is terminated before WEBVIEW attach');
            }

            try {
                await driver.waitUntil(async () => {
                    const contexts = await driver.getContexts();
                    return contexts.some((ctx) => String(ctx).includes('WEBVIEW'));
                }, {
                    timeout: timeoutMs,
                    timeoutMsg: 'WebView not available'
                });

                const contexts = (await driver.getContexts()).map(String);
                const webview = contexts.find((ctx) => String(ctx).includes('WEBVIEW'));

                console.log(`Available contexts (attempt ${attempt}):`, contexts);

                if (!webview) {
                    throw new Error('WebView not available');
                }

                await driver.switchContext(webview);
                await driver.pause(1000);

                const currentContext = await driver.getContext();
                if (!String(currentContext).includes('WEBVIEW')) {
                    throw new Error(`Context switched but still not in WEBVIEW. Current: ${currentContext}`);
                }

                console.log('Switched to:', currentContext);
                return;
            } catch (error) {
                lastError = error;

                if (this.isSessionTerminatedError(error) || !this.hasActiveSession()) {
                    throw error instanceof Error
                        ? error
                        : new Error('Appium session terminated during WEBVIEW attach');
                }

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
        if (!this.hasActiveSession()) {
            return;
        }
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