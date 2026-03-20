// Jabez Tho, A0273312N
import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { deleteUserByEmail } from "../../../db-util";

const salt = Math.random().toString(36).substring(7);

const E2E_USER = {
  name: "Search Test User",
  address: "123 Test Street",
  password: "password123",
  phone: "1234567890",
  email: `profiletest${salt}@test.com`,
  answer: "test",
};

let authState: { user: unknown; token: string } | null = null;

async function loginAsE2EUser(request: APIRequestContext) {
  const loginResponse = await request.post(
    "http://localhost:6060/api/v1/auth/login",
    {
      data: {
        email: E2E_USER.email,
        password: E2E_USER.password,
      },
    }
  );

  expect(loginResponse.ok()).toBeTruthy();
  return loginResponse.json();
}

test.beforeAll(async ({ request }) => {
  // create dummy user using backend
  await request.post("http://localhost:6060/api/v1/auth/register", {
    data: E2E_USER,
  });
});

test.afterAll(async () => {
  await deleteUserByEmail(E2E_USER.email);
});

test("search should work from landing page", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search").fill("law");
  // db already pre-seeded with product
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search Resuts" })
  ).toBeVisible();
  // pre-seeded product is "The Law of Contract in Singapore"
  await expect(
    page.getByRole("heading", { name: "The Law of Contract in Singapore" })
  ).toBeVisible();
});

test("search should work from from any page", async ({ page }) => {
  await page.goto("/categories");
  await page.getByPlaceholder("Search").fill("law");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Search Resuts" })
  ).toBeVisible();
  // pre-seeded product is "The Law of Contract in Singapore"
  await expect(
    page.getByRole("heading", { name: "The Law of Contract in Singapore" })
  ).toBeVisible();
});

test("search should work even if it is multi word", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search").fill("law of contract");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search Resuts" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Law of Contract in Singapore" })
  ).toBeVisible();
});

test("search should work even if it is partial word", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search").fill("ap");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search Resuts" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Law of Contract in Singapore" })
  ).toBeVisible();
});

test("search should match description as well", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search").fill("bestselling");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search Resuts" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Law of Contract in Singapore" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Novel" })).toBeVisible();
});

test("search should show no results if no match", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search").fill("no match");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search Resuts" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Law of Contract in Singapore" })
  ).not.toBeVisible();
});

// This is broken but not fixed as we are instructed not to fix a broken e2e
test("search should remains even after page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search").fill("law");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search Resuts" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Law of Contract in Singapore" })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Search Resuts" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Law of Contract in Singapore" })
  ).toBeVisible();
});

test("search should exhibit the same behaviour for a authenticated user", async ({
  page,
  request,
}) => {
  const loginData = await loginAsE2EUser(request);

  authState = {
    user: loginData.user,
    token: loginData.token,
  };

  await page.goto("/dashboard/user/profile");
  await page.evaluate((authState) => {
    if (authState) {
      window.localStorage.setItem("auth", JSON.stringify(authState));
    }
  }, authState);

  await page.getByPlaceholder("Search").fill("law");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search Resuts" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Law of Contract in Singapore" })
  ).toBeVisible();
});
