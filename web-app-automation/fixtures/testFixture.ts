import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

type Fixtures = {
  loggedInPage: Page;
};

export const test = base.extend<Fixtures>({
  loggedInPage: async ({ page }, use) => {

    const login = new LoginPage(page);

    await login.open();   // open login page
    await login.login();  // login using env variables

    await use(page);

  }
});