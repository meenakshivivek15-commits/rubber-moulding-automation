import BasePage from '../base.page';

class GoodsReceiptFormPage extends BasePage {

    // ========== SELECTORS ==========

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


    // ========== ACTIONS ==========

    async selectLocation(location: string) {

        await this.locationDropdown.waitForDisplayed({ timeout: 10000 });
        await this.locationDropdown.selectByVisibleText(location);

        console.log(`Location selected: ${location}`);
    }


    async enterPoNumber(poNumber: string) {

        await this.poInput.waitForDisplayed({ timeout: 10000 });

        console.log("Entering PO Number:", poNumber);

        await this.poInput.setValue(poNumber);
        await browser.keys('Tab');
    }


    async enterPin(pin: string) {

        await this.pinInput.waitForDisplayed({ timeout: 10000 });
        await this.pinInput.setValue(pin);
    }


    async submit() {

        await this.submitButton.waitForDisplayed({ timeout: 15000 });
        await this.submitButton.waitForEnabled({ timeout: 15000 });

        await this.submitButton.click();
    }
}

export default new GoodsReceiptFormPage();
