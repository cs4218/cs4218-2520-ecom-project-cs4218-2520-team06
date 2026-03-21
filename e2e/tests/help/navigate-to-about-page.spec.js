import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
})

test('about us page should be accessible from the home page when logged out', async ({ page }) => {
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { name: 'ABOUT US' })).toBeVisible();
});

test('about us page should be accessible from the home page when logged in', async ({ page }) => {
  // Arrange
  const user = {
    email: "cs4218@test.com",
    password: "cs4218@test.com",
  }

  // Act
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(user.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Assert
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { name: 'ABOUT US' })).toBeVisible();
});

test('about us page should be accessible from all sections in a dashboard when logged in', async ({ page }) => {
  // Arrange
  const user = {
    name: "CS 4218 Test Account",
    email: "cs4218@test.com",
    password: "cs4218@test.com",
  }
  const dashboardSectionLinks = ['Create Category', 'Create Product', 'Products', 'Orders', 'Users'];

  // Act
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(user.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  for (const sectionLink of dashboardSectionLinks) {
    await page.getByRole('button', { name: user.name }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: sectionLink }).click();

    // Assert
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('heading', { name: 'ABOUT US' })).toBeVisible();
  }  
});