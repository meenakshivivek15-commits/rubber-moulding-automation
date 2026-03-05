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


    async ensureWebView(timeout = 90000) {

    await browser.waitUntil(async () => {

        const contexts = await driver.getContexts();

        console.log("Available contexts:", contexts);

        const webview = contexts.find(c =>String(c).includes("WEBVIEW"));

        if (webview) {

            await driver.switchContext(webview);

            console.log("Switched to context:", webview);
            console.log("Current context:", await driver.getContext());

            return true;
        }

        return false;

    }, {
        timeout,
        interval: 3000,
        timeoutMsg: "WebView context not available"
    });

}
    async debugPageSource(label: string = "DEBUG") {

    console.log(`\n========== ${label} PAGE SOURCE ==========\n`);

    const source = await driver.getPageSource();

    console.log(source.substring(0, 3000)); // print first 3000 chars only

    console.log("\n========== END PAGE SOURCE ==========\n");

}

async scrollGrid(direction: "down" | "left"): Promise<void> {

    const rect: any = await driver.execute('mobile: viewportRect');

    await driver.execute('mobile: scrollGesture', {
        left: rect.left + 10,
        top: rect.top + 200,
        width: rect.width - 20,
        height: rect.height - 250,
        direction: direction,
        percent: 0.85
    });
    await browser.pause(1200);
}
    async scrollDashboard(): Promise<void> {

    await driver.execute(() => {

        const content = document.querySelector('ion-content');

        if (content) {
            content.scrollBy(0, 600);
        }

    });

}
    async safeClick(element: any): Promise<void> {

    const el = await element;

    await el.waitForDisplayed({ timeout: 15000 });
    await el.waitForEnabled({ timeout: 15000 });

    await el.scrollIntoView();

    try {
        await el.click();
    } catch (err) {

        console.log("Normal click failed — using JS click");

        await browser.execute((e: HTMLElement) => {
            e.click();
        }, el);
    }
}


    async safeType(element: WebdriverIO.Element, value: string) {

        await element.waitForDisplayed({ timeout: 15000 });
        await element.setValue(value);
    }
}
