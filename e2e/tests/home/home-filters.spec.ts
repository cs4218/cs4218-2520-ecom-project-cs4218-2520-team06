// Hans Delano, A0273456X
import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  // Control item is visible
  await expect(
    page.getByRole("heading", { name: "NUS T-shirt" })
  ).toBeVisible();

  await page.getByRole("checkbox", { name: "Book" }).check();
  await expect(page.getByRole("heading", { name: "Novel" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Textbook" })).toBeVisible();
  // Control item is not visible
  await expect(
    page.getByRole("heading", { name: "NUS T-shirt" })
  ).not.toBeVisible();

  await page.getByRole("checkbox", { name: "Book" }).uncheck();

  // Control item is visible
  await expect(page.getByRole("main")).toContainText("$4.99");

  await page.getByRole("radio", { name: "$40 to" }).check();

  await expect(page.getByRole("main")).toContainText("$54.99");
  // Control item is not visible
  await expect(page.getByRole("main")).not.toContainText("$4.99");

  await page.getByRole("button", { name: "RESET FILTERS" }).click();

  await expect(page.getByRole("main")).toContainText("$4.99");
  await expect(
    page.getByRole("heading", { name: "NUS T-shirt" })
  ).toBeVisible();

  await page.getByRole("checkbox", { name: "Book" }).check();
  await page.getByRole("radio", { name: "$100 or more" }).check();

  // Nothing is visible
  await expect(page.getByRole("heading", { name: "Novel" })).not.toBeVisible();
  await expect(page.getByRole("main")).not.toContainText("$54.99");

  await page.getByRole("button", { name: "RESET FILTERS" }).click();

  // Control item is visible
  await expect(
    page.getByRole("heading", { name: "NUS T-shirt" })
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("$4.99");
});
