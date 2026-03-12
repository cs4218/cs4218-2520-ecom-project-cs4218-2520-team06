import { describe, test, expect } from "@playwright/test";

describe("Login Tests", () => {
  test("Login with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("testRegister@gmail.com");
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("admin123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page.getByRole("main")).toContainText("🙏login successfully");
  });

  test("Login with invalid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("invalid@gmail.com");
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("invalid123");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page.getByRole("main")).toContainText(
      "Email is not registered"
    );
  });
});
