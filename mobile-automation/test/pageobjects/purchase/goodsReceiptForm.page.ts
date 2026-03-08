import BasePage from '../base.page';

class GoodsReceiptFormPage extends BasePage {

      get locationDropdown() {
        return $('select');
    }

    get poInput() {
        return $('input[type="text"]');
    }

    get pinInput() {
        return $$('input[type="number"]')[1];
    }

    get submitButton() {
        return $('(//ion-grid[@id="grid"])[2]/ion-row[11]/ion-col[1]/ion-button');
    }

   async waitForFormToLoad() {

    await this.switchToWebView();

    await this.poInput.waitForDisplayed({ timeout: 30000 });

    console.log('✅ Goods Receipt Form Loaded');
}

     async selectLocation(location: string) {

        await this.locationDropdown.waitForDisplayed({ timeout: 10000 });

        await this.locationDropdown.selectByVisibleText(location);

        console.log(`Location selected: ${location}`);
    }

     async enterPoNumber(poNumber: string) {

        await this.poInput.waitForDisplayed({ timeout: 10000 });

        console.log("Entering PO Number:", poNumber);

        await this.poInput.clearValue();
        await this.poInput.setValue(poNumber);

        // 🔴 IMPORTANT for Ionic validation
        await browser.keys('Tab');

    }

     async enterPin(pin: string) {

        await this.pinInput.waitForDisplayed({ timeout: 10000 });

        await this.pinInput.setValue(pin);

        // optional but safer
        await browser.keys('Tab');
    }

    async submit() {

        await this.submitButton.waitForDisplayed({ timeout: 15000 });

        await this.submitButton.waitForEnabled({ timeout: 20000 });

        await this.submitButton.scrollIntoView();

        await this.submitButton.click();

        console.log("Form submitted");
    }
}


export default new GoodsReceiptFormPage();