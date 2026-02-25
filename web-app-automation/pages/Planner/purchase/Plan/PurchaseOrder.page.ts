import { Page, expect } from '@playwright/test';
import { BasePage } from '../../../BasePage';

export interface POData {
  material: string;
  grade: string;
  supplier: string;
  location: string;
  quantity: number;
}

export class PurchaseOrderPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // ================= SELECT ALL MATERIALS =================
  async selectAllMaterials() {

    const dropdown = this.page.getByRole('combobox').first();
    await expect(dropdown).toBeVisible({ timeout: 15000 });

    await dropdown.click();
    await this.page.getByRole('option', { name: 'All Materials' }).click();

    console.log('All Materials selected');

    await expect(
      this.page.locator('ion-row ion-col.cell').first()
    ).toBeVisible({ timeout: 20000 });
  }

  // ================= FILTER MATERIAL =================
 async filterMaterial(material: string) {

  const searchInput = this.page
    .locator('input[placeholder="Search"]:visible')
    .first();

  await searchInput.waitFor({ state: 'visible', timeout: 20000 });

  await searchInput.fill('');
  await searchInput.fill(material);
  await this.page.keyboard.press('Enter');

  const materialCell = this.page.locator('ion-col.cell', {
    hasText: new RegExp(material.trim(), 'i')
  }).first();

  await materialCell.waitFor({ state: 'visible', timeout: 30000 });

  console.log(`Material filtered successfully: ${material}`);
}


  // ================= OPEN CREATE PO =================
  async openCreatePOForMaterialAndGrade(data: POData) {

    console.log(`Searching for Material: ${data.material}`);
    console.log(`Searching for Grade: ${data.grade}`);

    await expect(
      this.page.locator('ion-row ion-col.cell').first()
    ).toBeVisible({ timeout: 20000 });

    const row = this.page.locator('ion-row')
      .filter({
        has: this.page.locator('ion-col.cell', {
          hasText: new RegExp(data.material.trim(), 'i')
        })
      })
      .filter({
        has: this.page.locator('ion-col.cell', {
          hasText: new RegExp(data.grade.trim(), 'i')
        })
      })
      .first();

    await expect(row).toBeVisible({ timeout: 20000 });

    console.log('Correct row located successfully');

    const createButton = row.getByTestId('create-po-action');

    await expect(createButton).toBeVisible({ timeout: 15000 });
    await createButton.click();

    console.log('Create PO clicked');
  }

  // ================= VERIFY POPUP =================
  async verifyCreatePOPopupOpened() {

    await expect(
      this.page.locator('app-purchaseorderplanning')
    ).toBeVisible({ timeout: 20000 });

    console.log('Create PO popup opened');
  }

  // ================= FILL MANDATORY FIELDS =================
  async fillMandatoryFieldsInCreatePO(data: POData) {

    // ---------- SUPPLIER ----------
    const supplier = this.page.locator(
      'ion-col:has-text("Supplier") select'
    ).first();

    await expect(supplier).toBeVisible({ timeout: 20000 });
    await supplier.selectOption({ label: data.supplier });

    console.log('Supplier selected:', data.supplier);

    // ---------- LOCATION ----------
    const location = this.page.locator(
      'ion-col:has-text("Delivery At") select'
    ).first();

    await expect(location).toBeVisible({ timeout: 15000 });
    await location.selectOption({ label: data.location });

    console.log('Location selected:', data.location);

    // ---------- QUANTITY ----------
    const quantity = this.page
      .locator('ion-input[type="number"] input')
      .first();

    await expect(quantity).toBeVisible({ timeout: 15000 });
    await quantity.fill(data.quantity.toString());

    console.log('Quantity entered:', data.quantity);

    // ---------- DELIVERY DATE (EXPLICITLY SET) ----------
    const deliveryDateField = this.page.locator('#datefield');

    if (await deliveryDateField.count() > 0) {

      const today = new Date();
      today.setDate(today.getDate() + 5); // 5 days ahead
      const formattedDate = today.toISOString().split('T')[0];

      await deliveryDateField.fill(formattedDate);

      console.log('Delivery Date set:', formattedDate);
    }
  }

  // ================= GENERATE PO =================
  async generatePO() {

    const generateButton = this.page.getByRole('button', {
      name: /generate|raise po/i,
    });

    await expect(generateButton).toBeEnabled({ timeout: 20000 });
    await generateButton.click();

    console.log('Generate PO clicked');
  }

  // ================= CONFIRM PO & GET NUMBER =================
  async confirmRaisePO(): Promise<string> {

    const okButton = this.page.getByRole('button', { name: /^ok$/i });
    await okButton.waitFor({ state: 'visible', timeout: 15000 });
    await okButton.click();

    const toastMessage = this.page.locator('ion-toast .toast-message');

    await toastMessage.waitFor({ state: 'visible', timeout: 30000 });

    const text = await toastMessage.textContent();
    if (!text) throw new Error('Toast message not found');

    console.log('Toast message:', text);

    if (text.includes('Invalid')) {
      throw new Error(`PO creation failed: ${text}`);
    }

    const match = text.match(/Purchase Order:\s*(\S+)/i);
    if (!match) throw new Error('PO number not found');

    const poNumber = match[1];

    console.log('Generated PO:', poNumber);

    return poNumber;
  }
}
