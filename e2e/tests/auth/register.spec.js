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

describe("Register Tests", () => {
  const registerTestUser = {
    name: "testRegister",
    email: "testRegister@gmail.com",
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
    await userModel.deleteOne({ email: registerTestUser.email });
  });

  afterEach(async () => {
    // Clean up after each test
    await userModel.deleteOne({ email: registerTestUser.email });
  });

  test("Register with valid details", async ({ page }) => {
    await page.goto("http://localhost:3000/register");
    await page.getByRole("textbox", { name: "Enter Your Name" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill(registerTestUser.name);
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(registerTestUser.email);
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(registerTestUser.password);
    await page.getByRole("textbox", { name: "Enter Your Phone" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill(registerTestUser.phone);
    await page.getByRole("textbox", { name: "Enter Your Address" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill(registerTestUser.address);
    await page
      .getByRole("textbox", { name: "What is Your Favorite sports" })
      .click();
    await page
      .getByRole("textbox", { name: "What is Your Favorite sports" })
      .fill(registerTestUser.answer);
    await page.getByRole("button", { name: "REGISTER" }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(registerTestUser.email);
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(registerTestUser.password);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page.getByRole("main")).toContainText(
      "Registered successfully, please login"
    );
  });
});
