import BasePage from '../base.page';

class GoodsReceiptFormPage extends BasePage {

    get locationDropdown() {
        return $('select');
    }

    get invoiceLabelDate() {
        return $('ion-datetime .datetime-text');
    }

    get dateComponent() {
        return $('ion-datetime');
    }

    get pinInput() {
        return $('input[type="number"]');
    }

    get submitButton() {
        return $('//ion-button[contains(.,"Submit") or contains(.,"SAVE")]');
    }

    async waitForFormToLoad() {

        await this.switchToWebView();

        await browser.waitUntil(async () => {
            return await browser.execute(() =>
                !!document.querySelector('ion-datetime')
            );
        }, {
            timeout: 30000,
            timeoutMsg: 'Goods Receipt FORM page did not load'
        });

        console.log('✅ Goods Receipt Form Loaded');
    }

    async selectLocation(location: string) {

        await this.locationDropdown.waitForDisplayed({ timeout: 30000 });
        await this.locationDropdown.selectByVisibleText(location);

        console.log(`📍 Location selected: ${location}`);
    }

    async syncInvoiceDateFromLabel() {

    await this.switchToWebView();

    // Get the blue invoice date label
    const labelDate = await $('//*[contains(text(),"-20")]');

    await labelDate.waitForDisplayed({ timeout: 20000 });

    const dateText = (await labelDate.getText()).trim();

    console.log("📅 Label date:", dateText);

    const [day, month, year] = dateText.split('-');

    const formattedDate = `${year}-${month}-${day}`;

    const dateComponent = await $('ion-datetime');

    await dateComponent.waitForDisplayed({ timeout: 20000 });

    await browser.execute((el: any, value: string) => {

        el.value = value;

        el.dispatchEvent(new CustomEvent('ionChange', {
            detail: { value },
            bubbles: true
        }));

    }, dateComponent, formattedDate);

    console.log("📅 Invoice date synced:", formattedDate);
}
    async enterPin(pin: string) {

        await this.pinInput.waitForDisplayed({ timeout: 20000 });
        await this.pinInput.setValue(pin);

        console.log("🔐 PIN entered");
    }

    async submit() {

        await browser.waitUntil(
            async () => await this.submitButton.isEnabled(),
            {
                timeout: 20000,
                timeoutMsg: "Submit button did not enable"
            }
        );

        await this.submitButton.click();

        console.log("🚀 Form submitted");
    }
}

export default new GoodsReceiptFormPage();