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
  const tile = this.page.getByText(tileName, { exact: true });
  await expect(tile).toBeVisible({ timeout: 60000 });
  await tile.click();
}

}
