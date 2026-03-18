// Gallen Ong, A0252614L
// E2E test for Admin Orders critical paths
import { test, expect } from "../../fixtures/authenticatedAdmin.js";

test.describe("Admin Orders - E2E Tests", () => {
  test("navigates to orders and displays table", async ({
    adminPage,
  }) => {
    await adminPage.goto("http://localhost:3000/dashboard/admin/orders", {
      waitUntil: "networkidle",
    });

    await expect(
      adminPage.getByRole("heading", { name: /All Orders/i })
    ).toBeVisible({ timeout: 10000 });

    const ordersSection = adminPage.locator(".col-md-9");
    await expect(ordersSection.locator("table").first()).toBeVisible();
    await expect(ordersSection.getByRole("columnheader", { name: "Status" }).first()).toBeVisible();
    await expect(ordersSection.getByRole("columnheader", { name: "Buyer" }).first()).toBeVisible();
  });

  test("changes order status via dropdown", async ({ adminPage }) => {
    // Change from Not Processed -> Processing
    await adminPage.locator('#root').getByTitle('Not Processed').click();
    await adminPage.getByTitle('Processing').locator('div').click();
    await expect(adminPage.getByRole('main')).toContainText('Processing');
    
    // Change from Processing -> Delivered
    await adminPage.locator('#root').getByTitle('Processing').click();
    await adminPage.getByTitle('Delivered').locator('div').click();
    await expect(adminPage.getByRole('main')).toContainText('Delivered');
    
    // Change from Delivered -> Not Processed
    await adminPage.locator('#root').getByTitle('Delivered').click();
    await adminPage.getByTitle('Not Processed').locator('div').click();
    await expect(adminPage.getByRole('main')).toContainText('Not Processed');
  });
});
