// Jabez Tho, A0273312N
import { test, expect } from "@playwright/test";
import { deleteUserByEmail } from "../../../db-util";

test.describe.configure({ mode: "serial" });
const salt = Math.random().toString(36).substring(7);

const E2E_USER = {
  name: "Order Test User",
  address: "123 Test Street",
  password: "password123",
  phone: "1234567890",
  email: `profiletest${salt}@test.com`,
  answer: "test",
};

async function uiLogin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(E2E_USER.email);
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(E2E_USER.password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("**/");
  await expect(page.getByRole("button", { name: E2E_USER.name })).toBeVisible();
}

test.beforeAll(async ({ request }) => {
  // create dummy user using backend
  await request.post("http://localhost:6060/api/v1/auth/register", {
    data: E2E_USER,
  });
});

test.beforeEach(async ({ request, page }) => {
  await uiLogin(page);
  await page.goto("/dashboard/orders");
});

test.afterAll(async () => {
  await deleteUserByEmail(E2E_USER.email);
});

test("should be navigable via ui from initial page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: E2E_USER.name }).click();
  await page.getByRole("link", { name: "DASHBOARD" }).click();
  await page.getByRole("link", { name: "Orders" }).click();
  await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
});

test("should not display orders table for new user with no orders", async ({
  page,
}) => {
  await expect(page.getByRole("table")).not.toBeVisible();
});

// There's no way to add orders via the UI, so this test is a placeholder for when that feature is implemented
// test("upon adding orders, they should appear in the orders table", async ({
//   page,
//   browser,
// }) => {});
