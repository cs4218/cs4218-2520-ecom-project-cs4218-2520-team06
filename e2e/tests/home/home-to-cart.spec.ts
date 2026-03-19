// Hans Delano, A0273456X
import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await page
    .locator(".card-body", { hasText: "NUS T-shirt" })
    .getByRole("button", { name: "ADD TO CART" })
    .click();
  await page
    .locator(".card-body", { hasText: "Smartphone" })
    .getByRole("button", { name: "ADD TO CART" })
    .click();

  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole("main")).toContainText("NUS T-shirt");
  await expect(page.getByRole("main")).toContainText("Smartphone");
  await expect(page.getByRole("main")).toContainText("4.99");
  await page.getByText("Price : 999.99").click();
  await expect(page.getByRole("main")).toContainText("999.99");
  await expect(page.getByRole("main")).toContainText("$1,004.98");
});
