// Kok Bo Chang, A0273542E
import { test, expect, Page } from "@playwright/test";
import dotenv from "dotenv";
import connectDB from "../../../config/db";
import orderModel from "../../../models/orderModel";
import userModel from "../../../models/userModel";

const BASE_URL = "http://localhost:3000/";

const user = {
  name: "CS 4218 Test Account",
  email: "cs4218@test.com",
  password: "cs4218@test.com",
};

const validCardDetails = {
  number: "4111 1111 1111 1111",
  expirationDate: "1028",
  cvv: "123",
}

const itemNames = ["NUS T-shirt", "Smartphone"];

async function validateCartItems(page: Page, items: string[]) {
  // Check cart toast value
  await expect(page.locator('bdi')).toContainText(items.length.toString());

  // Check if cart content matches given items
  await page.getByRole("link", { name: "Cart" }).click();
  for (const name of items) {
    await expect(page.getByText(new RegExp(name, 'i')).first()).toBeVisible();
  }
}

async function login(page: Page) {
  await page.getByRole("link", { name: /login/i }).click();

  await page.getByRole("textbox", { name: /email/i }).fill(user.email);
  await page.getByRole("textbox", { name: /password/i }).fill(user.password);

  await page.getByRole("button", { name: /login/i }).click();

  // wait for login to complete
  await expect(page.getByText(user.name)).toBeVisible();
}

test.beforeAll(async () => {
  dotenv.config();
  await connectDB();
});

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);

  const userInDb = await userModel.findOne({ email: user.email });
  if (!userInDb) {
    throw Error("Test init failed")
  }

  await orderModel.deleteMany({ buyer: userInDb._id });
});

test.afterEach(async () => {
  const userInDb = await userModel.findOne({ email: user.email });
  if (!userInDb) {
    throw Error("Test cleanup failed")
  }

  await orderModel.deleteMany({ buyer: userInDb._id });
});

test('user shops for items but cannot checkout because they are not logged in', async ({ page }) => {
  // Empty Arrange

  // Act and Assert
  // Add two items to cart
  for (const name of itemNames) {
    await page.locator(".card-body", { hasText: name })
    .getByRole("button", { name: "ADD TO CART" })
    .click();
  }

  // User should not be able to check out
  await validateCartItems(page, itemNames);
  await expect(page.getByRole('button', { name: 'Please Login to checkout' })).toBeVisible();
});

test('user logs in, shops for items, checks out, and logs out', async ({ page }) => {
  // Arrange
  await login(page);

  // Act and Assert
  // Add two items to cart
  for (const name of itemNames) {
    await page.locator(".card-body", { hasText: name })
    .getByRole("button", { name: "ADD TO CART" })
    .click();
  }

  // User should be able to check out
  await validateCartItems(page, itemNames);

  // Checkout and start payment process
  await expect(page.getByRole('button', { name: 'Paying with Card' })).toBeVisible();
  await page.getByRole("button", { name: "Paying with Card" }).click();

  // Enter card details
  await page
    .locator('iframe[name="braintree-hosted-field-number"]')
    .contentFrame()
    .getByRole("textbox", { name: "Credit Card Number" })
    .fill(validCardDetails.number);
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .fill(validCardDetails.expirationDate);
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .fill(validCardDetails.cvv);

  // Make payment
  await expect(page.getByRole('button', { name: 'Make Payment' })).toBeVisible();
  await page.getByRole("button", { name: "Make Payment" }).click();

  // Ensure success screen shows the items that were bought
  await expect(
    page.getByRole("cell", { name: "Success" }).first()
  ).toBeVisible();

  // Validate number of items in placed order
  for (const item of itemNames) {
    await expect(page.getByText(item).first()).toBeVisible();
  }

  // Log out afterwards
  await page.getByRole('button', { name: user.name }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
});

test('user logs in, views more details of an item, buys both the item and some related items, checks out, and logs out', async ({ page }) => {
  // Arrange
  const similarItems = ["Textbook", "The Law of Contract Singapore"];
  await login(page);

  // Act and Assert
  // View more details for the item
  await page.locator(".card-body", { hasText: /novel/i })
    .getByRole('button', { name: /add to cart/i })
    .click();
  await page.locator(".card-body", { hasText: /novel/i })
    .getByRole('button', { name: /more details/i })
    .click();
  
  // Ensure that the item details are visible
  await expect(page.getByRole('heading', { name: /Product Details/i })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Name : Novel');
  await expect(page.getByRole('main')).toContainText('Description : A bestselling novel');
  await expect(page.getByRole('main')).toContainText('Price :$14.99');
  await expect(page.getByRole('main')).toContainText('Category : Book');

  // Add similar items to cart as well
  await page.getByTestId('related-product-66db427fdb0119d9234b27f1')
      .getByRole('button', { name: 'Add to Cart' })
      .click();
  await page.getByTestId('related-product-67a2171ea6d9e00ef2ac0229')
      .getByRole('button', { name: 'Add to Cart' })
      .click();

  // User should be able to check out
  const itemsInCart = similarItems.concat(["Novel"]);

  // Validate number of items in card
  await page.getByRole("link", { name: "Cart" }).click();
  const cards = page.locator(".row.card");
  await expect(cards).toHaveCount(itemsInCart.length, { timeout: 10000 });

  // Checkout and start payment process
  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByRole('button', { name: 'Paying with Card' })).toBeVisible();
  await page.getByRole("button", { name: "Paying with Card" }).click();

  // Enter card details
  await page
    .locator('iframe[name="braintree-hosted-field-number"]')
    .contentFrame()
    .getByRole("textbox", { name: "Credit Card Number" })
    .fill(validCardDetails.number);
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .fill(validCardDetails.expirationDate);
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .fill(validCardDetails.cvv);

  // Make payment
  await expect(page.getByRole('button', { name: 'Make Payment' })).toBeVisible();
  await page.getByRole("button", { name: "Make Payment" }).click();

  // Ensure success screen shows the items that were bought
  await expect(
    page.getByRole("cell", { name: "Success" }).first()
  ).toBeVisible();

  // Validate number of items in placed order
  const orderCards = page.locator(".row.card");
  await expect(orderCards).toHaveCount(itemsInCart.length, { timeout: 10000 });

  // Log out afterwards
  await page.getByRole('button', { name: user.name }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
});