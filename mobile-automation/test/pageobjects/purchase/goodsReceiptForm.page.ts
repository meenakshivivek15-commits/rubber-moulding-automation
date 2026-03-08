import BasePage from '../base.page';

class GoodsReceiptFormPage extends BasePage {

    get locationDropdown() {
        return $('select');
    }

    get poLabel() {
        return $('//*[contains(text(),"PO/Invoice Ref")]/following::*[contains(text(),"LP")]');
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

    async fillPoFromLabel() {

        await this.poLabel.waitForDisplayed({ timeout: 20000 });

        const poValue = (await this.poLabel.getText()).trim();

        console.log("📄 PO from label:", poValue);

        await this.poInput.setValue(poValue);

        console.log("📄 PO copied to input field");
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

        await this.submitButton.click();

        console.log("🚀 Goods Receipt submitted");
    }
}

export default new GoodsReceiptFormPage();