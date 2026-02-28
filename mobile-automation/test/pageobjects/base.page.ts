export default class BasePage {

    protected isSessionTerminatedError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        return /A session is either terminated or not started|invalid session id|Session ID is not set/i.test(message);
    }

    private hasActiveSession(): boolean {
        return Boolean(driver.sessionId);
    }

  async switchToWebView(timeoutMs: number = 120000) {

    let lastError: unknown;
    const maxAttempts = 4;
    const perAttemptTimeout = Math.max(15000, Math.floor(timeoutMs / maxAttempts));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (!this.hasActiveSession()) {
            throw new Error('Appium session is terminated before WEBVIEW attach');
        }

        try {
            await driver.waitUntil(async () => {
                const contexts = await driver.getContexts();
                return contexts.some((ctx: any) => String(ctx).includes('WEBVIEW'));
            }, {
                timeout: perAttemptTimeout,
                interval: 1200,
                timeoutMsg: 'WebView not available'
            });

            const contexts = await driver.getContexts() as string[];

            console.log(`Available contexts (attempt ${attempt}):`, contexts);

            const webview = contexts.find((context) => String(context).includes('WEBVIEW'));

            if (!webview) {
                throw new Error('WebView not available');
            }

            await driver.switchContext(webview);

            const current = await driver.getContext();
            console.log('===== AFTER SWITCH =====');
            console.log('Current context:', current);

            return;
        } catch (error) {
            lastError = error;

            if (this.isSessionTerminatedError(error) || !this.hasActiveSession()) {
                throw error instanceof Error ? error : new Error('Appium session terminated during WEBVIEW attach');
            }

            await driver.activateApp('com.ppaoperator.app').catch(() => undefined);
            await this.switchToNative().catch(() => undefined);
            await driver.pause(1500);
            console.log(`WebView attach attempt ${attempt} failed, retrying...`);
        }
    }

    throw lastError instanceof Error ? lastError : new Error('WebView not available');

}

    async switchToNative() {
        if (!this.hasActiveSession()) {
            return;
        }
        await driver.switchContext('NATIVE_APP');
    }


    async ensureWebView(timeoutMs: number = 120000) {

        const contexts = (await driver.getContexts()) as string[];

        const webview = contexts.find(ctx => ctx.includes('WEBVIEW'));

        if (!webview) {
            await this.switchToWebView(timeoutMs);
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
