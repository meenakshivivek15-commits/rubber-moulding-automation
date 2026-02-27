// @ts-nocheck
import { driver } from '@wdio/globals';

export async function ensureWebView() {
    await driver.waitUntil(async () => {
        const contexts = await driver.getContexts();
        return contexts.some((ctx: string) => String(ctx).includes('WEBVIEW'));
    }, {
        timeout: 30000,
        timeoutMsg: 'WebView not available'
    });

    const contexts = await driver.getContexts();
    const webview = contexts.find((ctx: string) => String(ctx).includes('WEBVIEW'));

    if (!webview) {
        throw new Error('WebView not available');
    }

    await driver.switchContext(String(webview));
}
