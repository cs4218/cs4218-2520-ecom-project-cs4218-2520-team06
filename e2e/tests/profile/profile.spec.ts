// Jabez Tho, A0273312N
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { deleteUserByEmail } from "../../../db-util";

test.describe.configure({ mode: "serial" });
const salt = Math.random().toString(36).substring(7);

const E2E_USER = {
  name: "Profile Test User",
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

async function fillProfileForm(
  page: Page,
  values: {
    name?: string;
    phone?: string;
    address?: string;
    password?: string;
  }
) {
  if (values.name !== undefined) {
    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill(values.name);
  }
  if (values.phone !== undefined) {
    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill(values.phone);
  }
  if (values.address !== undefined) {
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill(values.address);
  }
  if (values.password !== undefined) {
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(values.password);
  }
}

async function assertProfileFormValues(
  page: Page,
  values: { name?: string; phone?: string; address?: string }
) {
  await page.goto("/dashboard/user/profile");
  if (values.name !== undefined) {
    await expect(
      page.getByRole("textbox", { name: "Enter Your Name" })
    ).toHaveValue(values.name);
  }
  if (values.phone !== undefined) {
    await expect(
      page.getByRole("textbox", { name: "Enter Your Phone" })
    ).toHaveValue(values.phone);
  }
  if (values.address !== undefined) {
    await expect(
      page.getByRole("textbox", { name: "Enter Your Address" })
    ).toHaveValue(values.address);
  }
}

async function assertUserPageProfileValues(
  page: Page,
  values: { name?: string; email?: string; address?: string }
) {
  await page.goto("/dashboard/user");
  if (values.name !== undefined) {
    await expect(
      page.getByRole("heading", { name: values.name, exact: true })
    ).toBeVisible();
  }
  if (values.email !== undefined) {
    await expect(
      page.getByRole("heading", { name: values.email, exact: true })
    ).toBeVisible();
  }
  if (values.address !== undefined) {
    await expect(
      page.getByRole("heading", { name: values.address, exact: true })
    ).toBeVisible();
  }
}

test.beforeAll(async ({ request }) => {
  // create dummy user using backend
  await request.post("http://localhost:6060/api/v1/auth/register", {
    data: E2E_USER,
  });
});

test.beforeEach(async ({ request, page }) => {
  await uiLogin(page);
  await page.goto("/dashboard/user");
});

test.afterAll(async () => {
  await deleteUserByEmail(E2E_USER.email);
});

test("should update user profile", async ({ request, page }) => {
  await page.getByRole("link", { name: "Profile" }).click();
  await fillProfileForm(page, {
    name: "Updated Name",
    phone: "0987654321",
    address: "456 Updated Street",
  });
  await page.getByRole("button", { name: "UPDATE", exact: true }).click();
  await expect(
    page.getByText("Profile Updated Successfully").first()
  ).toBeVisible();
  await page.reload();

  // Verify both the form values and the displayed profile values on user page are updated
  await assertUserPageProfileValues(page, {
    name: "Updated Name",
    email: E2E_USER.email,
    address: "456 Updated Street",
  });
  await assertProfileFormValues(page, {
    name: "Updated Name",
    phone: "0987654321",
    address: "456 Updated Street",
  });
  await expect(
    page.getByRole("button", { name: "Updated Name" })
  ).toBeVisible();

  // Revert changes
  await page.getByRole("link", { name: "Profile" }).click();
  await fillProfileForm(page, {
    name: E2E_USER.name,
    phone: E2E_USER.phone,
    address: E2E_USER.address,
  });
  await page.getByRole("button", { name: "UPDATE", exact: true }).click();
  await expect(
    page.getByText("Profile Updated Successfully").first()
  ).toBeVisible();
});

test("should update user profile with partial update (address only)", async ({
  page,
}) => {
  const partialUpdate = { address: "789 Partial Street" };

  await page.getByRole("link", { name: "Profile" }).click();
  await fillProfileForm(page, partialUpdate);
  await page.getByRole("button", { name: "UPDATE", exact: true }).click();
  await expect(
    page.getByText("Profile Updated Successfully").first()
  ).toBeVisible();
  await page.reload();

  // Verify address changed but other fields remained unchanged
  await assertProfileFormValues(page, {
    name: E2E_USER.name,
    phone: E2E_USER.phone,
    address: partialUpdate.address,
  });
  await assertUserPageProfileValues(page, {
    name: E2E_USER.name,
    email: E2E_USER.email,
    address: partialUpdate.address,
  });

  // Revert address change
  await page.getByRole("link", { name: "Profile" }).click();
  await fillProfileForm(page, { address: E2E_USER.address });
  await page.getByRole("button", { name: "UPDATE", exact: true }).click();
  await expect(
    page.getByText("Profile Updated Successfully").first()
  ).toBeVisible();
});

test("profile update persist after session clear", async ({ page }) => {
  const persistedProfile = {
    name: "Persisted Name",
    phone: "7777777777",
    address: "777 Persisted Street",
    password: "newpassword123",
  };

  await page.getByRole("link", { name: "Profile" }).click();
  await fillProfileForm(page, persistedProfile);
  await page.getByRole("button", { name: "UPDATE", exact: true }).click();
  await expect(
    page.getByText("Profile Updated Successfully").first()
  ).toBeVisible();
  await page.reload();

  await page.evaluate(() => {
    // clear all local
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  // manual relogin to verify persisted profile data after session clear
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(E2E_USER.email);
  // new password
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(persistedProfile.password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.getByRole("heading", { name: "All Products" }).waitFor();
  await assertProfileFormValues(page, persistedProfile);
  await assertUserPageProfileValues(page, {
    name: persistedProfile.name,
    email: E2E_USER.email,
    address: persistedProfile.address,
  });

  await expect(
    page.getByRole("button", { name: "Persisted Name" })
  ).toBeVisible();

  // Revert changes
  await page.getByRole("link", { name: "Profile" }).click();
  await fillProfileForm(page, {
    name: E2E_USER.name,
    phone: E2E_USER.phone,
    address: E2E_USER.address,
    password: E2E_USER.password,
  });
  await page.getByRole("button", { name: "UPDATE", exact: true }).click();
  await expect(
    page.getByText("Profile Updated Successfully").first()
  ).toBeVisible();
});

test("profile update fails with short password and profile page shouldn't display new values", async ({
  page,
}) => {
  const invalidAttempt = {
    name: "Invalid Update Name",
    phone: "1111111111",
    address: "111 Invalid Street",
    password: "12345",
  };

  await page.getByRole("link", { name: "Profile" }).click();
  await fillProfileForm(page, invalidAttempt);
  await page.getByRole("button", { name: "UPDATE", exact: true }).click();

  await expect(
    page.getByText("Passsword is required and 6 character long")
  ).toBeVisible();
  await page.reload();

  await assertProfileFormValues(page, {
    name: E2E_USER.name,
    phone: E2E_USER.phone,
    address: E2E_USER.address,
  });
  await assertUserPageProfileValues(page, {
    name: E2E_USER.name,
    email: E2E_USER.email,
    address: E2E_USER.address,
  });
  await expect(page.getByRole("button", { name: E2E_USER.name })).toBeVisible();
});
