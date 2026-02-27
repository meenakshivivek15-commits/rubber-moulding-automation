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

    private readonly submitButtonSelectors = [
        'form ion-button[type="submit"]',
        'ion-footer ion-button[type="submit"]',
        '//ion-button[@type="submit" and not(@disabled)]',
        '//ion-button[contains(normalize-space(),"Submit") or contains(normalize-space(),"SUBMIT") or contains(normalize-space(),"Save")]',
    ];

    private async getSubmitButton(): Promise<WebdriverIO.Element> {
        for (const selector of this.submitButtonSelectors) {
            const elements = await $$(selector);

            for (const element of elements) {
                const displayed = await element.isDisplayed().catch(() => false);
                if (!displayed) {
                    continue;
                }

                const enabled = await element.isEnabled().catch(() => false);
                if (!enabled) {
                    continue;
                }

                console.log(`Submit button located using selector: ${selector}`);
                return element;
            }
        }

        throw new Error('Submit button not found on Goods Receipt form');
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
        const submitButton = await this.getSubmitButton();

        await submitButton.scrollIntoView();
        await submitButton.waitForDisplayed({ timeout: 20000 });
        await submitButton.waitForEnabled({ timeout: 20000 });

        try {
            await submitButton.click();
        } catch {
            console.log('Normal submit click failed — using JS click fallback');
            await driver.execute((el) => {
                (el as HTMLElement).click();
            }, submitButton);
        }

        console.log("Submit clicked");
    }
}

export default new GoodsReceiptFormPage();