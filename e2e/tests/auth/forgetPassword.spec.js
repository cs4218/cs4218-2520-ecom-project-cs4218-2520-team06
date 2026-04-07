// Gabriel Chang, A0276978Y
import { describe, test, expect, beforeAll, afterAll } from "@playwright/test";
import userModel from "../../../models/userModel";
import dotenv from "dotenv";
import connectDB from "../../../config/db";
import bcrypt from "bcrypt";

describe("Forget Password Tests", () => {
  // Using a unique email to allow multiple parallel test runs without conflicts
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const user = {
    name: `testForgetPassword${timestamp}`,
    email: `testForgetPassword${timestamp}${randomNum}@gmail.com`,
    phone: "91234567",
    address: "my address",
    password: "admin123",
    answer: "soccer",
  };

  beforeAll(async () => {
    dotenv.config();
    connectDB();
    await userModel.deleteOne({ email: user.email });
    await new userModel({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    }).save();
  });

  afterAll(async () => {
    await userModel.deleteOne({ email: user.email });
  });

  test("Login Form redirects to Forget Password Form", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByRole("button", { name: "Forgot Password" }).click();

    await expect(page).toHaveURL("http://localhost:3000/forgot-password");
    await expect(page.getByRole("main")).toMatchAriaSnapshot(`
    - heading "FORGOT PASSWORD FORM" [level=4]
    - textbox "Enter Your Email"
    - textbox "Enter Your New Password"
    - textbox "What is your favorite sport?"
    - button "RESET PASSWORD"
    `);
  });

  test("Succeeds with valid email and answer", async ({ page }) => {
    await page.goto("http://localhost:3000/forgot-password");
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(user.email);
    await page
      .getByRole("textbox", { name: "Enter Your New Password" })
      .click();
    await page
      .getByRole("textbox", { name: "Enter Your New Password" })
      .fill("adminPassword123!");
    await page
      .getByRole("textbox", { name: "What is your favorite sport?" })
      .click();
    await page
      .getByRole("textbox", { name: "What is your favorite sport?" })
      .fill(user.answer);
    await page.getByRole("button", { name: "RESET PASSWORD" }).click();
    await expect(page.getByRole("main")).toContainText(
      "Password Reset Successfully"
    );
  });

  test("Fails with invalid email", async ({ page }) => {
    await page.goto("http://localhost:3000/forgot-password");
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("invalid@email.com");
    await page
      .getByRole("textbox", { name: "Enter Your New Password" })
      .click();
    await page
      .getByRole("textbox", { name: "Enter Your New Password" })
      .fill("adminPassword123!");
    await page
      .getByRole("textbox", { name: "What is your favorite sport?" })
      .click();
    await page
      .getByRole("textbox", { name: "What is your favorite sport?" })
      .fill(user.answer);
    await page.getByRole("button", { name: "RESET PASSWORD" }).click();
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Wrong email or answer$/ })
        .nth(2)
    ).toBeVisible();
  });

  test("Fails with valid email but wrong answer", async ({ page }) => {
    await page.goto("http://localhost:3000/forgot-password");
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(user.email);
    await page
      .getByRole("textbox", { name: "Enter Your New Password" })
      .click();
    await page
      .getByRole("textbox", { name: "Enter Your New Password" })
      .fill("adminPassword123!");
    await page
      .getByRole("textbox", { name: "What is your favorite sport?" })
      .click();
    await page
      .getByRole("textbox", { name: "What is your favorite sport?" })
      .fill("wrong answer");
    await page.getByRole("button", { name: "RESET PASSWORD" }).click();
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Wrong email or answer$/ })
        .nth(2)
    ).toBeVisible();
  });
});
