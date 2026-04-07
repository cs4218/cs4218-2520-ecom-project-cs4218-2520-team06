// Jabez Tho, A0273312N
import { test, expect } from "@playwright/test";
import { deleteUserByEmail, setUserAsAdmin } from "../../../db-util";
import { ensureNavbarExpanded } from "../utils/navbar";

test.describe.configure({ mode: "serial" });
const salt = Math.random().toString(36).substring(7);

const E2E_USER = {
  name: "Admin Order Test User",
  address: "123 Test Street",
  password: "passwordStrong123!",
  phone: "1234567890",
  email: `profiletest${salt}@test.com`,
  answer: "test",
  role: 1,
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
  await ensureNavbarExpanded(page);
  await expect(page.getByRole("button", { name: E2E_USER.name })).toBeVisible();
}

test.beforeAll(async ({ request }) => {
  // create dummy user using backend
  await request.post("http://localhost:6060/api/v1/auth/register", {
    data: E2E_USER,
  });

  // call test db util to set as admin
  const success = await setUserAsAdmin(E2E_USER.email);
  if (!success) {
    throw new Error(`Failed to set E2E user ${E2E_USER.email} as admin`);
  }
});

test.beforeEach(async ({ request, page }) => {
  await uiLogin(page);
  await page.goto("/dashboard/admin/users");
});

test.afterAll(async () => {
  await deleteUserByEmail(E2E_USER.email);
});

test("should be navigable via ui from initial page", async ({ page }) => {
  await page.goto("/");
  await ensureNavbarExpanded(page);
  await page.getByRole("button", { name: E2E_USER.name }).click();
  await page.getByRole("link", { name: "DASHBOARD" }).click();
  await page.getByRole("link", { name: "Users" }).click();
  await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
});

test("should display own user in users list with correct type and fields", async ({
  page,
}) => {
  const row = page.getByRole("row").filter({ hasText: E2E_USER.email });
  await expect(row).toContainText("Admin");
  await expect(row).toContainText(E2E_USER.name);
  await expect(row).toContainText(E2E_USER.phone);
});

test("upon creating a new basic user should display in user list with correct values", async ({
  page,
  browser,
}) => {
  const userToCreate = {
    name: "Admin Test User Add",
    email: `admintestuseradd${salt}@test.com`,
    password: "passwordStrong123!",
    phone: "1234567890",
    address: "123 Test Street",
    answer: "test answer",
  };

  // start creating user using separate context
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  await userPage.goto("/register");
  await userPage
    .getByRole("textbox", { name: "Enter Your Name" })
    .fill(userToCreate.name);
  await userPage.getByRole("textbox", { name: "Enter Your Email" }).click();
  await userPage
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(userToCreate.email);
  await userPage.getByRole("textbox", { name: "Enter Your Password" }).click();
  await userPage
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(userToCreate.password);
  await userPage.getByRole("textbox", { name: "Enter Your Phone" }).click();
  await userPage
    .getByRole("textbox", { name: "Enter Your Phone" })
    .fill(userToCreate.phone);
  await userPage.getByRole("textbox", { name: "Enter Your Address" }).click();
  await userPage
    .getByRole("textbox", { name: "Enter Your Address" })
    .fill(userToCreate.address);
  await userPage
    .getByRole("textbox", { name: "What is Your Favorite sports" })
    .click();
  await userPage
    .getByRole("textbox", { name: "What is Your Favorite sports" })
    .fill(userToCreate.answer);
  await userPage.getByRole("button", { name: "REGISTER", exact: true }).click();
  await userPage.waitForURL("**/login");
  await userContext.close();

  // check user appears in admin user list
  await page.reload();
  const row = page.getByRole("row").filter({ hasText: userToCreate.email });
  await expect(
    row.getByRole("cell", { name: "User", exact: true })
  ).toBeVisible();
  await expect(row).toContainText(userToCreate.name);
  await expect(row).toContainText(userToCreate.phone);

  // cleanup - delete created user
  await deleteUserByEmail(userToCreate.email);
});
