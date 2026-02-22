import { Page, expect } from '@playwright/test';

export class BillPassingPage {
  constructor(private page: Page) {}

  // =========================================================
  // APPROVE BILL FOR GIVEN PO
  // =========================================================
  async approveBillForPO(poNumber: string) {

    console.log(`Searching for PO: ${poNumber}`);

    const poCell = this.page.locator(
      `table tbody td:nth-child(3):has-text("${poNumber}")`
    );

    await poCell.first().waitFor({ timeout: 20000 });

    const row = poCell.first().locator('xpath=ancestor::tr');
    const approveBtn = row.locator('span.approve_button.link');

    await approveBtn.scrollIntoViewIfNeeded();
    await approveBtn.click();

    console.log(`Approve clicked for PO: ${poNumber}`);
  }

  // =========================================================
  // WAIT FOR BILL PASSING POPUP
  // =========================================================
  async waitForBillPassingPopup() {

    const popup = this.page.locator('.ui-dialog')
      .filter({ hasText: 'Bill Passing' })
      .first();

    await popup.waitFor({ state: 'visible', timeout: 20000 });

    console.log('Bill Passing popup opened');
  }

  // =========================================================
  // CONFIRM POPUP (FINAL VALIDATED VERSION)
  // =========================================================
  async confirmPopup(
    taxRate: string = '18',
    expectAlert: boolean = false
  ) {

    const popup = this.page.locator('.ui-dialog')
      .filter({ hasText: 'Bill Passing' })
      .first();

    await popup.waitFor({ state: 'visible', timeout: 20000 });

    console.log('Bill Passing popup fully visible');

    // ================= LOCATORS =================
    const hsnField = this.page.locator('#grn_hsncode');
    const taxDropdown = this.page.locator('#grn_taxrate');
    const basicAmountField = this.page.locator('#grn_invAmount');
    const cgstField = this.page.locator('#grn_cgstval');
    const sgstField = this.page.locator('#grn_sgstval');
    const grandTotal = this.page.locator('#grn_grandtotal');

    // =====================================================
    // WAIT FOR HSN AUTO FILL
    // =====================================================
    await expect(hsnField).toBeVisible({ timeout: 20000 });

    await expect.poll(async () => {
      return await hsnField.inputValue();
    }, { timeout: 20000 }).not.toBe('');

    console.log('HSN Code loaded');

    // =====================================================
    // WAIT FOR TAX DROPDOWN ENABLED
    // =====================================================
    await expect(taxDropdown).toBeVisible({ timeout: 20000 });

    await expect.poll(async () => {
      return await taxDropdown.isEnabled();
    }, { timeout: 20000 }).toBe(true);

    console.log('Tax dropdown enabled');

    // =====================================================
    // SELECT TAX RATE
    // =====================================================
    await taxDropdown.selectOption({ label: taxRate });
    console.log(`Tax rate selected: ${taxRate}%`);

    // =====================================================
    // WAIT FOR BASIC AMOUNT
    // =====================================================
    await expect(basicAmountField).toBeVisible({ timeout: 20000 });

    await expect.poll(async () => {
      const val = await basicAmountField.inputValue();
      return parseFloat(val.replace(/,/g, ''));
    }, { timeout: 30000 }).toBeGreaterThan(0);

    const baseAmountRaw = await basicAmountField.inputValue();
    const baseAmount = parseFloat(baseAmountRaw.replace(/,/g, ''));

    console.log('Base Amount:', baseAmount);

    // =====================================================
    // CALCULATE CGST + SGST
    // =====================================================
    const rate = parseFloat(taxRate);
    const totalTax = (baseAmount * rate) / 100;
    const halfTax = parseFloat((totalTax / 2).toFixed(2));

    console.log('Total Tax:', totalTax.toFixed(2));
    console.log('CGST:', halfTax);
    console.log('SGST:', halfTax);

    // =====================================================
    // ENTER CGST WITH BLUR
    // =====================================================
    await cgstField.click();
    await cgstField.fill('');
    await cgstField.type(halfTax.toString());
    await cgstField.evaluate(el => el.blur());
    console.log('CGST entered and blur triggered');

    // =====================================================
    // ENTER SGST WITH BLUR
    // =====================================================
    await sgstField.click();
    await sgstField.fill('');
    await sgstField.type(halfTax.toString());
    await sgstField.evaluate(el => el.blur());
    console.log('SGST entered and blur triggered');

    // =====================================================
    // WAIT FOR GRAND TOTAL UPDATE
    // =====================================================
    await expect.poll(async () => {
      const totalText = await grandTotal.textContent();
      return parseFloat(totalText?.replace(/,/g, '') || '0');
    }, { timeout: 30000 }).toBeGreaterThan(baseAmount);

    const finalTotalText = await grandTotal.textContent();
    const actualTotal = parseFloat(
      finalTotalText?.replace(/,/g, '') || '0'
    );

    // =====================================================
    // FINANCIAL VALIDATION (MANDATORY)
    // =====================================================
    const expectedTotal = parseFloat(
      (baseAmount + halfTax + halfTax).toFixed(2)
    );

    console.log('Expected Total:', expectedTotal);
    console.log('Actual Total:', actualTotal);

    expect(actualTotal).toBeCloseTo(expectedTotal, 2);

    // =====================================================
    // HANDLE JS ALERT (OPTIONAL VALIDATION)
    // =====================================================
    let alertTriggered = false;

    this.page.once('dialog', async dialog => {
      alertTriggered = true;
      const message = dialog.message();

      console.log('JS Alert detected:', message);

      if (expectAlert) {
        expect(message).toContain(
          'Calculated Total as per Tax Rate and Tax Value Entered does not Match'
        );
      }

      await dialog.accept();
    });

    // =====================================================
    // CLICK APPROVE
    // =====================================================
    const approveBtn = popup.locator('button')
      .filter({ hasText: /approve/i })
      .first();

    await expect(approveBtn).toBeVisible({ timeout: 20000 });
    await approveBtn.click();

    console.log('Popup Approve clicked');

    // =====================================================
    // ASSERT ALERT BEHAVIOR
    // =====================================================
    if (expectAlert) {
      await expect.poll(() => alertTriggered).toBeTruthy();
    } else {
      await this.page.waitForTimeout(1000);
      expect(alertTriggered).toBeFalsy();
    }
  }

  // =========================================================
  // FINAL OK BUTTON
  // =========================================================
  async confirmFinalOk() {

    const okBtn = this.page.locator('button')
      .filter({ hasText: /^ok$/i })
      .first();

    await expect(okBtn).toBeVisible({ timeout: 20000 });
    await okBtn.click();

    console.log('Final OK clicked');
  }

  // =========================================================
  // VERIFY PO REMOVED
  // =========================================================
  async verifyPORemoved(poNumber: string) {

    await expect(
      this.page.locator(`td:text-is("${poNumber}")`)
    ).toHaveCount(0, { timeout: 20000 });

    console.log(`PO ${poNumber} removed from table`);
  }
}
