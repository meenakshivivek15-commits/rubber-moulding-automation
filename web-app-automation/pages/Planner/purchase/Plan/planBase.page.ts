import { Page, expect } from '@playwright/test';
import { SideMenuPage } from '../../../SideMenuPage';
import { BasePage } from '../../../BasePage';


export class PlanBasePage extends BasePage {
  private sideMenu: SideMenuPage;

 constructor(page: Page) {
  super(page);
  this.sideMenu = new SideMenuPage(page);
}


  async openPlan() {
  await this.sideMenu.openMenu();
  await this.sideMenu.clickMenuItem('Plan');
  await this.page.waitForURL('**/Planhome', { timeout: 60000 });
}

async openPlanTile(tileName: string) {

  await this.page.waitForLoadState('networkidle');

  const tile = this.page.locator(`mat-card:has-text("${tileName}")`).first();

  await expect(tile).toBeVisible({ timeout: 60000 });

  await tile.click();

  console.log(`${tileName} tile opened`);
}

}
