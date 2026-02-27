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
        await browser.keys('Tab');
    }

    private async ensureMandatoryValuesPresent(): Promise<void> {
        const locationValue = (await this.locationDropdown.getValue().catch(() => '')).toString().trim();
        const poValue = (await this.poInput.getValue().catch(() => '')).toString().trim();
        const pinValue = (await this.pinInput.getValue().catch(() => '')).toString().trim();

        if (!locationValue || !poValue || !pinValue) {
            throw new Error(`Mandatory values missing before submit (location='${locationValue}', po='${poValue}', pin='${pinValue ? 'set' : ''}')`);
        }
    }

    async submit() {
        await this.ensureWebView(60000);
        await this.ensureMandatoryValuesPresent();

        await this.submitButton.waitForDisplayed({ timeout: 15000 });

        await browser.waitUntil(async () => {
            const enabled = await this.submitButton.isEnabled().catch(() => false);
            if (!enabled) {
                await browser.keys('Tab').catch(() => undefined);
            }
            return enabled;
        }, {
            timeout: 60000,
            interval: 1500,
            timeoutMsg: 'Submit button did not become enabled after mandatory fields were entered'
        });

        await this.submitButton.click();
    }
}

export default new GoodsReceiptFormPage();