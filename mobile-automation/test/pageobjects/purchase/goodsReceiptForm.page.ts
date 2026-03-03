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

        await this.invoiceLabelDate.waitForDisplayed({ timeout: 20000 });

        const dateText = (await this.invoiceLabelDate.getText()).trim();
        console.log("📅 Label date:", dateText);

        const [day, month, year] = dateText.split('-');
        const pad = (n: string) => n.padStart(2, '0');
        const formattedDate = `${year}-${pad(month)}-${pad(day)}`;

        const dateComponent = await this.dateComponent;

        await browser.execute((el: any, value: string) => {
            el.setAttribute('value', value);
            el.value = value;
            el.dispatchEvent(new CustomEvent('ionChange', {
                detail: { value },
                bubbles: true
            }));
        }, dateComponent, formattedDate);

        console.log("📅 Invoice date synced");
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