import { test as base } from '@playwright/test'
import LoginPage from '../pages/login.page'

export const test = base.extend({
  loggedInPage: async ({ page }, use) => {

    const login = new LoginPage(page)

    await page.goto(process.env.PLANNER_URL!)
    await login.login(
      process.env.PPA_USER!,
      process.env.PPA_PASSWORD!
    )

    await use(page)
  }
})
