// Gallen Ong, A0252614L
// E2E tests for authorization - user and admin dashboard access
import { describe, test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const ADMIN_EMAIL = "test-admin@example.com";
const ADMIN_PASSWORD = "passwordStrong123!";
const USER_EMAIL = "test-user@example.com";
const USER_PASSWORD = "passwordStrong123!";

describe("Authorization E2E Tests", () => {
  test("admin can log in and access admin dashboard", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(ADMIN_EMAIL);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL(`${BASE_URL}/`);

    await page.getByRole("button", { name: /test-admin/i }).click();
    await page.getByRole("link", { name: /dashboard/i }).click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByRole("link", { name: "Create Category" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create Product" })
    ).toBeVisible();
  });

  test("regular user can log in and access user dashboard", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);

    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(USER_EMAIL);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(USER_PASSWORD);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL(`${BASE_URL}/`);

    await page.getByRole("button", { name: /test-user/i }).click();
    await page.getByRole("link", { name: /dashboard/i }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create Category" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create Product" })
    ).not.toBeVisible();
  });

  test("regular user is blocked from accessing admin dashboard", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);

    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(USER_EMAIL);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(USER_PASSWORD);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL(`${BASE_URL}/`);

    await page.goto(`${BASE_URL}/dashboard/admin`);
    await page.waitForTimeout(2000);

    await expect(
      page.getByRole("link", { name: "Create Category" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create Product" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Admin Panel" })
    ).not.toBeVisible();
  });

  test("unauthenticated user cannot access user dashboard", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/dashboard/user`);
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.getByRole("link", { name: "Profile" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Orders" })).not.toBeVisible();
  });
});
