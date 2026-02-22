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
        return $('ion-button[type="submit"], ion-button');
    }

    // ========== ACTIONS ==========

    async selectLocation(location: string) {
        await this.locationDropdown.waitForDisplayed({ timeout: 15000 });
        await this.locationDropdown.selectByVisibleText(location);
        console.log(`Location selected: ${location}`);
    }

    async enterPoNumber(poNumber: string) {
        await this.poInput.waitForDisplayed({ timeout: 15000 });
        await this.poInput.setValue(poNumber);
        await browser.pause(500);
    }

    async enterPin(pin: string) {
        await this.pinInput.waitForDisplayed({ timeout: 15000 });
        await this.pinInput.setValue(pin);
    }

    async submit() {
        await this.submitButton.waitForDisplayed({ timeout: 20000 });
        await this.submitButton.waitForEnabled({ timeout: 20000 });
        await this.submitButton.click();
        console.log("Submit clicked");
    }
}

export default new GoodsReceiptFormPage();