export async function ensureWebView() {

    const contexts = await driver.getContexts();
    console.log("Available contexts:", contexts);

    const appWebView = contexts.find(ctx =>
        ctx === 'WEBVIEW_com.ppaoperator.app'
    );

    if (!appWebView) {
        throw new Error('Correct App WebView not found');
    }

    await driver.switchContext(appWebView);

    console.log("Switched to:", appWebView);
}
