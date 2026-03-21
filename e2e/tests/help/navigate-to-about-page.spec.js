// Kok Bo Chang, A0273542E
import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000/";

const user = {
  name: "CS 4218 Test Account",
  email: "cs4218@test.com",
  password: "cs4218@test.com",
};

const dashboardSectionLinks = [
  "Create Category",
  "Create Product",
  "Products",
  "Orders",
  "Users",
];

async function login(page) {
  await page.getByRole("link", { name: /login/i }).click();

  await page.getByRole("textbox", { name: /email/i }).fill(user.email);
  await page.getByRole("textbox", { name: /password/i }).fill(user.password);

  await page.getByRole("button", { name: /login/i }).click();

  // wait for login to complete
  await expect(page.getByText(user.name)).toBeVisible();
}

async function goToAboutPageAndValidate(page) {
  await page.getByRole("link", { name: /about/i }).click();

  await expect(
    page.getByRole("heading", { name: /about us/i })
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
});

test("About page accessible when logged out", async ({ page }) => {
  await goToAboutPageAndValidate(page);
});

test("About page accessible when logged in", async ({ page }) => {
  await login(page);
  await goToAboutPageAndValidate(page);
});

test("About page accessible from all dashboard sections", async ({ page }) => {
  await login(page);

  for (const section of dashboardSectionLinks) {
    // Open user dropdown menu
    await page.getByRole("button", { name: user.name }).click();

    // Wait for dropdown to render
    const dashboardLink = page.getByRole("link", { name: /dashboard/i });
    await expect(dashboardLink).toBeVisible();

    // Go to dashboard
    await dashboardLink.click();
    await page.waitForURL(/dashboard/);

    // Navigate to section
    const sectionLink = page.getByRole("link", { name: section });
    await expect(sectionLink).toBeVisible();
    await sectionLink.click();

    // Validate About page from this section
    await goToAboutPageAndValidate(page);

    // Reset state for next iteration
    await page.goBack();
  }
});