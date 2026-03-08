import BasePage from '../base.page';

class GoodsReceiptFormPage extends BasePage {

      get locationDropdown() {
        return $('select');
    }

    get poInput() {
        return $('input[type="text"]');
    }
get quantityInput() {
    return $('input[type="number"]');
}

get invoiceDateInput() {
    return $('ion-datetime');
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
    async copyInvoiceDateFromLabel() {

    const label = await $('//*[contains(text(),"Invoice Date")]/following::ion-label[1]');
    await label.waitForDisplayed({ timeout: 20000 });

    const labelDate = (await label.getText()).trim();

    console.log("Invoice label date:", labelDate);

    const [day, month, year] = labelDate.split("-");
    const formattedDate = `${year}-${month}-${day}`;

    const dateComponent = await $('ion-datetime');

    await browser.execute((el: any, value: string) => {

        el.value = value;

        el.dispatchEvent(new CustomEvent('ionChange', {
            detail: { value },
            bubbles: true
        }));

    }, dateComponent, formattedDate);

    console.log("Invoice date set:", formattedDate);
}

async copyQuantityFromLabel() {

    const qtyLabel = await $('//*[contains(text(),"Quantity")]/following::ion-label[1]');
    await qtyLabel.waitForDisplayed({ timeout: 20000 });

    const qtyValue = (await qtyLabel.getText()).trim();

    console.log("Quantity label:", qtyValue);

    const qtyInput = await $('input[type="number"]');

    await qtyInput.clearValue();
    await qtyInput.setValue(qtyValue);

    console.log("Quantity copied to input:", qtyValue);
}

     async enterPin(pin: string) {

        await this.pinInput.waitForDisplayed({ timeout: 10000 });

        await this.pinInput.setValue(pin);

        // optional but safer
        await browser.keys('Tab');
    }

   async submit() {

    const submitButton = await $('//ion-button[contains(.,"Submit")]');

    await submitButton.waitForDisplayed({ timeout: 20000 });

    const enabled = await submitButton.isEnabled();

    if (!enabled) {

        console.log("❌ Submit button is disabled.");

        const location = await this.locationDropdown.getValue();
        const qty = await this.quantityInput.getValue();
        const pin = await this.pinInput.getValue();

        console.log("Location value:", location);
        console.log("Quantity value:", qty);
        console.log("PIN value:", pin);

        throw new Error("Submit button disabled. Required fields missing.");
    }

    console.log("✅ Submit button enabled");

    await submitButton.click();

    console.log("Form submitted");
}
}


export default new GoodsReceiptFormPage();