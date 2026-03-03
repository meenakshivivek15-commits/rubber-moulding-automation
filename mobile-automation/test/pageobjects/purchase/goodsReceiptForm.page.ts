import BasePage from '../base.page';

class GoodsReceiptFormPage extends BasePage {

    // ================= SELECTORS =================

get locationDropdown() {
    return $('select');
}

get invoiceLabelDate() {
    return $('//ion-datetime//div[@class="datetime-text"]');
}

get dateComponent() {
    return $('ion-datetime[formcontrolname="invdate"]');
}

get pinInput() {
    return $('input[type="number"]');
}

get submitButton() {
    return $('//ion-button[contains(.,"Submit") or contains(.,"SAVE")]');
}

    // ================= ACTIONS =================

    async selectLocation(location: string) {
         // Ensure we are in WEBVIEW (critical for CI)
    await this.ensureWebView();

        await this.locationDropdown.waitForDisplayed({ timeout: 20000 });
        await this.locationDropdown.selectByVisibleText(location);
        console.log(`✅ Location selected: ${location}`);
    }

    async syncInvoiceDateFromLabel() {
        await this.ensureWebView();
        // Wait for label date
        await this.invoiceLabelDate.waitForDisplayed({ timeout: 20000 });

        const dateText = (await this.invoiceLabelDate.getText()).trim();
        console.log("📅 Label date:", dateText);

        const [day, month, year] = dateText.split('-');

        const pad = (n: string) => n.padStart(2, '0');
        const formattedDate = `${year}-${pad(month)}-${pad(day)}`;

        console.log("📅 Formatted date:", formattedDate);

        const dateComponent = await this.dateComponent;

        // Update Ionic ion-datetime correctly
        await browser.execute((el: any, value: string) => {
            el.setAttribute('value', value);
            el.value = value;
            el.dispatchEvent(new CustomEvent('ionChange', {
                detail: { value },
                bubbles: true
            }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }, dateComponent, formattedDate);

        console.log("✅ Invoice date synced");
    }

    async enterPin(pin: string) {

        await this.ensureWebView();
        await this.pinInput.waitForDisplayed({ timeout: 20000 });
        await this.pinInput.setValue(pin);
        console.log("🔐 PIN entered:", pin);
    }

    async submit() {

        // Wait until button becomes enabled (Angular validation)
        await browser.waitUntil(
            async () => await this.submitButton.isEnabled(),
            {
                timeout: 20000,
                timeoutMsg: "❌ Submit button did not enable"
            }
        );

        await this.submitButton.click();
        console.log("🚀 Form submitted successfully");
    }
}

export default new GoodsReceiptFormPage();