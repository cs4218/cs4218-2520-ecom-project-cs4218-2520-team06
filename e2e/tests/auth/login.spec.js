// Gabriel Chang, A0276978Y
import { describe, test, expect, beforeAll, afterAll } from "@playwright/test";
import userModel from "../../../models/userModel";
import dotenv from "dotenv";
import connectDB from "../../../config/db";
import bcrypt from "bcrypt";

describe("Login Tests", () => {
  const loginTestUser = {
    name: "testLogin",
    email: "testLogin@gmail.com",
    phone: "91234567",
    address: "my address",
    password: "admin123",
    answer: "soccer",
  };

  beforeAll(async () => {
    dotenv.config();
    connectDB();
    await userModel.deleteOne({ email: loginTestUser.email });
    await new userModel({
      ...loginTestUser,
      password: await bcrypt.hash(loginTestUser.password, 10),
    }).save();
  });

  afterAll(async () => {
    await userModel.deleteOne({ email: loginTestUser.email });
  });

  test("Login with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(loginTestUser.email);
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(loginTestUser.password);
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
