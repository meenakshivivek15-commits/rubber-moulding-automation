import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/login.page';
import { HomePage } from '../../../pages/home.page';
import { readJson } from '../../../../common/utils/fileHelper';


test.setTimeout(60_000);

test('Login → Home → Open Plan from hamburger menu', async ({ page }) => {

  const data = readJson('purchase/createPO.json');
  console.log(data);

  const loginPage = new LoginPage(page);
  const homePage = new HomePage(page);

  await loginPage.open();
  await loginPage.login();   // ✅ no arguments

  await homePage.verifyHomePage();
  await homePage.openPlanFromMenu();
});
