import { test as baseTest } from "@playwright/test";

/**
 * Shared fixture for admin authentication
 * Logs in once per worker and shares the authenticated page across all tests
 * 
 * Usage in test files:
 *   import { test, expect } from "./fixtures/authenticatedAdmin.js";
 *   
 *   test("your test", async ({ authenticatedPage }) => {
 *     await authenticatedPage.goto(...);
 *   });
 */

const ADMIN_EMAIL = 'test-admin@example.com';
const ADMIN_PASSWORD = 'password';

export const test = baseTest.extend({
  adminPage: [
    async ({ browser }, use) => {
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('http://localhost:3000/login');
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(ADMIN_EMAIL);
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: 'LOGIN' }).click();
      await page.waitForNavigation();
      
      // Share this page for all tests
      await use(page);
      await context.close();
    },
    { scope: 'worker' },
  ],
});

export { describe, expect } from "@playwright/test";
