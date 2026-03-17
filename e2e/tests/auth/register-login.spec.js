import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from "@playwright/test";
import dotenv from "dotenv";
import connectDB from "../../../config/db";
import userModel from "../../../models/userModel";

describe("Register-Login Tests", () => {
  const user = {
    name: "testRegisterLogin",
    email: "testRegisterLogin@gmail.com",
    phone: "91234567",
    address: "my address",
    password: "admin123",
    answer: "soccer",
  };

  beforeAll(async () => {
    dotenv.config();
    connectDB();
  });

  beforeEach(async () => {
    // Ensure clean state before each test
    await userModel.deleteOne({ email: user.email });
  });

  afterEach(async () => {
    // Clean up after each test
    await userModel.deleteOne({ email: user.email });
  });

  test("Register with valid details", async ({ page }) => {
    await page.goto("http://localhost:3000/register");
    await page.getByRole("textbox", { name: "Enter Your Name" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill(user.name);
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(user.email);
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(user.password);
    await page.getByRole("textbox", { name: "Enter Your Phone" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill(user.phone);
    await page.getByRole("textbox", { name: "Enter Your Address" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill(user.address);
    await page
      .getByRole("textbox", { name: "What is Your Favorite sports" })
      .click();
    await page
      .getByRole("textbox", { name: "What is Your Favorite sports" })
      .fill(user.answer);
    await page.getByRole("button", { name: "REGISTER" }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(user.email);
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(user.password);
    await page.getByRole("button", { name: "LOGIN" }).click();
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
});
