// @ts-nocheck
import { driver } from '@wdio/globals';

export async function ensureWebView() {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const contexts = (await driver.getContexts()).map(String);
            console.log('Available contexts:', contexts);

            const appWebView = contexts.find((ctx: string) => ctx === 'WEBVIEW_com.ppaoperator.app')
                || contexts.find((ctx: string) => ctx.startsWith('WEBVIEW'));

            if (!appWebView) {
                throw new Error('App WebView not found');
            }

            await driver.switchContext(appWebView);

            const currentContext = String(await driver.getContext());
            if (!currentContext.includes('WEBVIEW')) {
                throw new Error(`Switch returned non-web context: ${currentContext}`);
            }

            console.log('Switched to:', currentContext);
            return;
        } catch (error) {
            lastError = error;
            await driver.switchContext('NATIVE_APP').catch(() => undefined);
            await driver.pause(1000);
        }
    }

    throw lastError instanceof Error ? lastError : new Error('Unable to switch to app webview');
}
