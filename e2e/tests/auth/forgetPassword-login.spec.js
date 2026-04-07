// Gabriel Chang, A0276978Y
import { describe, test, expect, beforeAll, afterAll } from "@playwright/test";
import userModel from "../../../models/userModel";
import dotenv from "dotenv";
import connectDB from "../../../config/db";
import bcrypt from "bcrypt";

describe("Forget Password to Login Tests", () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const user = {
    name: `testForgetPasswordLogin${timestamp}`,
    email: `testForgetPasswordLogin${timestamp}${randomNum}@gmail.com`,
    phone: "91234567",
    address: "my address",
    password: "admin123Strong!",
    answer: "soccer",
  };

  const newPassword = "newPassword123!";

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

  test("After resetting password, user can log in with new password", async ({
    page,
  }) => {
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
      .fill(newPassword);
    await page
      .getByRole("textbox", { name: "What is your favorite sport?" })
      .click();
    await page
      .getByRole("textbox", { name: "What is your favorite sport?" })
      .fill(user.answer);
    await page.getByRole("button", { name: "RESET PASSWORD" }).click();
    await page.waitForURL("**/login");
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(user.email);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(newPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page.getByRole("main")).toContainText("🙏login successfully");
  });
});
