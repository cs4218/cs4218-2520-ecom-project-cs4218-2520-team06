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

describe("Admin Dashboard UI Tests", () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const user = {
    name: `testAdminDashboard${timestamp}`,
    email: `testAdminDashboard${timestamp}${randomNum}@gmail.com`,
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
  });

  afterAll(async () => {
    await userModel.deleteOne({ email: user.email });
  });

  test("displays admin menu and correct information", async () => {
    await loggedInPage.goto("http://localhost:3000/dashboard/admin");

    await expect(loggedInPage.getByRole("main")).toMatchAriaSnapshot(`
    - heading "Admin Panel" [level=4]
    - link "Create Category"
    - link "Create Product"
    - link "Products"
    - link "Orders"
    - link "Users"
    `);
    await expect(loggedInPage.getByRole("main")).toMatchAriaSnapshot(`
    - 'heading "Admin Name : ${user.name}" [level=3]'
    - 'heading "Admin Email : ${user.email}" [level=3]'
    - 'heading "Admin Contact : ${user.phone}" [level=3]'
    `);
  });
});
