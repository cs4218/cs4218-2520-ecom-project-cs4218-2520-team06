// Gallen Ong, A0252614L
// E2E test for Admin Create, Update, Delete Product Workflow
import { describe, test, expect } from "../../fixtures/authenticatedAdmin.js";

const timestamp = Date.now();
const testProduct = `Test Product ${timestamp}`;
const updatedTestProduct = `Updated Test Product ${timestamp}`;

describe("CreateProduct - Admin Workflow", async () => {
  test("should create a new product successfully", async ({ adminPage }) => {
    await adminPage.goto("http://localhost:3000/dashboard/admin/create-product");
    
    await adminPage.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
    await adminPage.getByTitle(/Clothing/).waitFor({ state: "visible", timeout: 5000 });
    await adminPage.getByTitle(/Clothing/).locator('div').click();
    await adminPage.getByRole('textbox', { name: /write a name/ }).fill(testProduct);
    await adminPage.getByRole('textbox', { name: /write a description/ }).fill('Test Description');
    await adminPage.getByPlaceholder(/write a Price/).fill('10');
    await adminPage.getByPlaceholder(/write a quantity/).fill('5');
    await adminPage.locator('div').filter({ hasText: /^Select Shipping$/ }).nth(1).click();
    await adminPage.getByText(/Yes/).click();
    await adminPage.getByRole('button', { name: /CREATE PRODUCT/ }).click();
    
    await expect(adminPage.getByRole('link', { name: testProduct })).toBeVisible({ timeout: 10000 });
  });
  
  test("should verify category selection is saved", async ({ adminPage }) => {
    await adminPage.getByRole('link', { name: testProduct }).click();
    await adminPage.waitForLoadState("networkidle");
    
    await expect(adminPage.getByRole('main')).toContainText('Clothing', { timeout: 10000 });
  });

  test("should update an existing product", async ({ adminPage }) => {
    const nameInput = adminPage.getByRole('textbox', { name: 'write a name' });
    await expect(nameInput).toHaveValue(testProduct, { timeout: 10000 });
    await nameInput.clear();
    await nameInput.fill(updatedTestProduct);
    
    await adminPage.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await adminPage.waitForLoadState("networkidle");
    
    await expect(adminPage.getByRole('heading', { name: 'All Products List' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: updatedTestProduct })).toBeVisible({ timeout: 10000 });
  });

  test("should delete the product", async ({ adminPage }) => {
    await adminPage.getByRole('link', { name: updatedTestProduct }).click();
    await adminPage.waitForLoadState("networkidle");
    
    const nameInput = adminPage.getByRole('textbox', { name: 'write a name' });
    await expect(nameInput).toHaveValue(updatedTestProduct, { timeout: 10000 });
    
    adminPage.once('dialog', dialog => {
      dialog.accept();
    });
    await adminPage.getByRole('button', { name: 'DELETE PRODUCT' }).click();
    await adminPage.waitForLoadState("networkidle");
    
    await expect(adminPage.getByRole('heading', { name: 'All Products List' })).toBeVisible();
    await expect(adminPage.getByRole('link', { name: updatedTestProduct })).not.toBeVisible({ timeout: 10000 });
  });

  test("should validate required field - product name", async ({ adminPage }) => {
    await adminPage.goto("http://localhost:3000/dashboard/admin/create-product");
    
    await adminPage.getByRole('textbox', { name: /write a description/ }).fill('Test Description');
    await adminPage.getByRole('button', { name: /CREATE PRODUCT/ }).click();
    
    await expect(adminPage.locator('div').filter({ hasText: /^Name is Required$/ }).nth(2)).toBeVisible();
  });

  test("should navigate using sidebar menu", async ({ adminPage }) => {
    await adminPage.goto("http://localhost:3000/dashboard/admin/products");
    const sidebar = adminPage.locator('.list-group.dashboard-menu');
    await expect(sidebar).toBeVisible();
    
    await adminPage.getByRole('link', { name: /Create Product/i }).click();
    await expect(adminPage.getByRole('heading', { name: /Create Product/i })).toBeVisible({ timeout: 5000 });
    
    await adminPage.getByRole('link', { name: /Create Category/i }).click();
    await expect(adminPage.getByRole('heading', { name: /Manage Category/i })).toBeVisible({ timeout: 5000 });
    
    await adminPage.getByRole('link', { name: /Products/i }).click();
    await expect(adminPage.getByRole('heading', { name: /All Products List/i })).toBeVisible({ timeout: 5000 });
  });
});
