// Hans Delano, A0273456X
import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("test@gmail.com");
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("test@gmail.com");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page
    .locator(".card-body", { hasText: "Laptop" })
    .getByRole("button", { name: "ADD TO CART" })
    .click();
  await page
    .locator(".card-body", { hasText: "Smartphone" })
    .getByRole("button", { name: "ADD TO CART" })
    .click();

  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByText("Laptop", { exact: true })).toBeVisible();
  await expect(page.getByText("Smartphone", { exact: true })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("$2,499.98");

  await page.getByRole("button", { name: "Paying with Card" }).click();
  await page
    .locator('iframe[name="braintree-hosted-field-number"]')
    .contentFrame()
    .getByRole("textbox", { name: "Credit Card Number" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-number"]')
    .contentFrame()
    .getByRole("textbox", { name: "Credit Card Number" })
    .fill("4000 1111 1111 1115");
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .fill("1028");
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .fill("123");
  await page.getByRole("button", { name: "Make Payment" }).click();

  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Processor Declined$/ })
      .nth(1)
  ).toBeVisible();
});
