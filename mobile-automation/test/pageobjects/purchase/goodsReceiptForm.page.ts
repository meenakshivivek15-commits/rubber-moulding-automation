import BasePage from '../base.page';

class GoodsReceiptFormPage extends BasePage {

    get locationDropdown() {
        return $('select');
    }

    
    get poInput() {
    return $('//*[contains(text(),"PO/Invoice Ref")]/following::input[1]');
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

    async enterPo(poNumber: string) {

    await this.poInput.waitForDisplayed({ timeout: 20000 });

    await this.poInput.clearValue();
    await this.poInput.setValue(poNumber);

    // trigger Angular validation
    await browser.execute((el) => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }, await this.poInput);

    console.log("📄 PO entered:", poNumber);
}

    async enterPin(pin: string) {

        await this.pinInput.waitForDisplayed({ timeout: 20000 });

        await this.pinInput.setValue(pin);

        console.log("🔐 PIN entered:", pin);
    }

    async submit() {

    await this.submitButton.waitForDisplayed({ timeout: 20000 });

    await browser.waitUntil(
        async () => await this.submitButton.isEnabled(),
        {
            timeout: 20000,
            timeoutMsg: "Submit button did not enable"
        }
    );

    await this.submitButton.scrollIntoView();
    await this.submitButton.click();

    console.log("🚀 Form submitted");
}
}

export default new GoodsReceiptFormPage();