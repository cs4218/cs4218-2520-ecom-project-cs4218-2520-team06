// Kok Bo Chang, A0273542E
import { test, expect, Page } from '@playwright/test';

const user = {
  email: "cs4218@test.com",
  password: "cs4218@test.com",
}

const itemNames = ["NUS T-shirt", "Smartphone"];

async function validateCartItems(page: Page, items: string[]) {
  // Check cart toast value
  await expect(page.locator('bdi')).toContainText(items.length.toString());

  // Check if cart content matches given items
  await page.getByRole("link", { name: "Cart" }).click();
  for (const name of items) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
})

test('logging in should not affect existing items in cart', async ({ page }) => {
  // Arrange
  // Add two items to cart
  for (const name of itemNames) {
    await page.locator(".card-body", { hasText: name })
    .getByRole("button", { name: "ADD TO CART" })
    .click();
  }

  await validateCartItems(page, itemNames);

  // Act (log in)
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(user.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  // Re-assert all cart values
  await validateCartItems(page, itemNames);
});

test('logging out should not affect existing items in cart', async ({ page }) => {
  // Arrange
  // Log in first
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(user.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Add two items to cart
  for (const name of itemNames) {
    await page.locator(".card-body", { hasText: name })
    .getByRole("button", { name: "ADD TO CART" })
    .click();
  }

  await validateCartItems(page, itemNames);

  // Act (log out)
  await page.getByRole('button', { name: 'CS 4218 Test Account' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  
  // Re-assert all cart values
  await validateCartItems(page, itemNames);
});