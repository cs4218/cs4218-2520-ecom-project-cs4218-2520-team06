// Gallen Ong, A0252614L
// E2E test for Admin Create, Update, Delete Category Workflow
import { describe, test, expect } from "../../fixtures/authenticatedAdmin.js";

describe("Create Category - Admin Workflow", async () => {  
  test("should create a new category successfully", async ({ adminPage }) => {
    await adminPage.goto("http://localhost:3000/dashboard/admin/create-category", { waitUntil: "networkidle" });
    await adminPage.getByRole('textbox', { name: 'Enter new category' }).fill('New Category');
    await adminPage.getByRole('button', { name: 'Submit' }).click();
    await expect(adminPage.locator('tbody')).toContainText('New Category');
    await expect(adminPage.getByRole('cell', { name: 'New Category' })).toBeVisible();
  });

  test("should display error when creating duplicate category", async ({ adminPage }) => {
    await adminPage.getByRole('textbox', { name: 'Enter new category' }).fill('New Category');
    await adminPage.getByRole('button', { name: 'Submit' }).click();
    await expect(adminPage.locator('div').filter({ hasText: /^Category Already Exists$/ }).nth(2)).toBeVisible();
  });

  test("should update an existing category", async ({ adminPage }) => {
    await adminPage.getByRole('button', { name: 'Edit' }).nth(4).click();
    await adminPage.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('Updated Category');
    await adminPage.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    await expect(adminPage.locator('tbody')).toContainText('Updated Category');
    await expect(adminPage.getByRole('cell', { name: 'Updated Category' })).toBeVisible();
  });

  test("should delete a category", async ({ adminPage }) => {
    adminPage.once('dialog', dialog => {
      dialog.accept();
    });
    await adminPage.getByRole('button', { name: 'Delete' }).nth(4).click();
    await expect(adminPage.locator('div').filter({ hasText: /^Category is deleted$/ }).nth(1)).toBeVisible();
  });
});
