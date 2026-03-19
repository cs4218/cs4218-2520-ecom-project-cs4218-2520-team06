// Hans Delano, A0273456X
import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "All Categories" }).click();

  await page.getByTestId("category-btn-book").click();
  await expect(page.getByRole("heading", { name: "Textbook" })).toBeVisible();
  await page
    .locator(".card-body", { hasText: "Textbook" })
    .getByRole("button", { name: "ADD TO CART" })
    .click();

  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "Electronics" }).click();
  await expect(page.getByRole("heading", { name: "Smartphone" })).toBeVisible();
  await page
    .locator(".card-body", { hasText: "Smartphone" })
    .getByRole("button", { name: "ADD TO CART" })
    .click();

  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByText("Textbook", { exact: true })).toBeVisible();
  await expect(page.getByText("Smartphone", { exact: true })).toBeVisible();
});
