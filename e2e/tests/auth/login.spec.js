// Gabriel Chang, A0276978Y
import { describe, test, expect, beforeAll, afterAll } from "@playwright/test";
import userModel from "../../../models/userModel";
import dotenv from "dotenv";
import connectDB from "../../../config/db";
import bcrypt from "bcrypt";

describe("Login Tests", () => {
  // Using a unique email to allow multiple parallel test runs without conflicts
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const user = {
    name: `testLogin${timestamp}`,
    email: `testLogin${timestamp}${randomNum}@gmail.com`,
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

  test("Login with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(user.email);
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(user.password);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page.getByRole("main")).toContainText("🙏login successfully");
  });

  test("Login with invalid email", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("invalid@gmail.com");
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(user.password);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page.getByRole("main")).toContainText(
      "Email is not registered"
    );
  });

  test("Login with invalid password", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(user.email);
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("invalid123");
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page.getByRole("main")).toContainText("Invalid Password");
  });
});
