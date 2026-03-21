// Gabriel Chang, A0276978Y
import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from "@playwright/test";
import userModel from "../../../models/userModel";
import dotenv from "dotenv";
import connectDB from "../../../config/db";
import bcrypt from "bcrypt";

describe("Admin Menu UI Tests", () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const user = {
    name: `testAdminMenu${timestamp}`,
    email: `testAdminMenu${timestamp}${randomNum}@gmail.com`,
    phone: "91234567",
    address: "my address",
    password: "admin123",
    answer: "soccer",
    role: 1,
  };

  let loggedInPage;
  beforeAll(async () => {
    dotenv.config();
    connectDB();
    await userModel.deleteOne({ email: user.email });
    await new userModel({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    }).save();
  });

  beforeEach(async ({ page }) => {
    loggedInPage = page;
    await page.goto("http://localhost:3000/login");
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(user.email);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(user.password);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForNavigation();
    await page.goto("http://localhost:3000/dashboard/admin");
  });

  afterAll(async () => {
    await userModel.deleteOne({ email: user.email });
  });

  test("displays correct links", async () => {
    await expect(loggedInPage.getByRole("main")).toMatchAriaSnapshot(`
    - heading "Admin Panel" [level=4]
    - link "Create Category"
    - link "Create Product"
    - link "Products"
    - link "Orders"
    - link "Users"
    `);
  });

  test("create category link navigates to correct page", async () => {
    await loggedInPage.getByRole("link", { name: "Create Category" }).click();

    await expect(loggedInPage).toHaveURL(
      "http://localhost:3000/dashboard/admin/create-category"
    );
    await expect(loggedInPage.locator("h1")).toMatchAriaSnapshot(
      `- heading "Manage Category" [level=1]`
    );
  });

  test("create product link navigates to correct page", async () => {
    await loggedInPage.getByRole("link", { name: "Create Product" }).click();

    await expect(loggedInPage).toHaveURL(
      "http://localhost:3000/dashboard/admin/create-product"
    );
    await expect(loggedInPage.locator("h1")).toMatchAriaSnapshot(
      `- heading "Create Product" [level=1]`
    );
  });

  test("products link navigates to correct page", async () => {
    await loggedInPage.getByRole("link", { name: "Products" }).click();

    await expect(loggedInPage).toHaveURL(
      "http://localhost:3000/dashboard/admin/products"
    );
    await expect(loggedInPage.locator("h1")).toMatchAriaSnapshot(
      `- heading "All Products List" [level=1]`
    );
  });

  test("orders link navigates to correct page", async () => {
    await loggedInPage.getByRole("link", { name: "Orders" }).click();

    await expect(loggedInPage).toHaveURL(
      "http://localhost:3000/dashboard/admin/orders"
    );
    await expect(loggedInPage.locator("h1")).toMatchAriaSnapshot(
      `- heading "All Orders" [level=1]`
    );
  });

  test("users link navigates to correct page", async () => {
    await loggedInPage.getByRole("link", { name: "Users" }).click();

    await expect(loggedInPage).toHaveURL(
      "http://localhost:3000/dashboard/admin/users"
    );
    await expect(loggedInPage.locator("h1")).toMatchAriaSnapshot(
      `- heading "All Users" [level=1]`
    );
  });
});
