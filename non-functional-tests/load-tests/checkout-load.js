// Gabriel Chang, A0276978Y
import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { getRandomUserCredentials } from "./utils.js";
import { BASE_URL } from "./scripts/constants.js";
import { Rate, Trend, Counter } from "k6/metrics";

export const options = baseOptions;
const MOCK_PAYMENT_PATH = "/api/v1/product/mock/payment";

const checkoutErrorRate = new Rate("checkout_error_rate");
const checkoutDuration = new Trend("checkout_duration", true);
const successfulCheckouts = new Counter("successful_checkouts");

export default () => {
  // Get random product
  const productRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`);
  check(productRes, { "product list status is 200": (r) => r.status === 200 });
  const products = productRes.json().products;
  const product = products[Math.floor(Math.random() * products.length)];

  // Login
  const credentials = getRandomUserCredentials();
  const loginPayload = JSON.stringify({
    email: credentials.email,
    password: credentials.password,
  });

  const loginParams = {
    headers: { "Content-Type": "application/json" },
  };

  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    loginPayload,
    loginParams
  );
  check(loginRes, { "login status is 200": (r) => r.status === 200 });

  const token = loginRes.json().token;
  if (!token) return;

  // Checkout
  const checkoutParams = {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  };

  const checkoutPayload = JSON.stringify({
    cart: [product],
  });

  const res = http.post(
    `${BASE_URL}${MOCK_PAYMENT_PATH}`,
    checkoutPayload,
    checkoutParams
  );
  checkoutDuration.add(res.timings.duration);
  const checkoutSuccessful = check(res, {
    "mock payment status is 200": (r) => r.status === 200,
  });
  if (checkoutSuccessful) {
    successfulCheckouts.add(1);
    checkoutErrorRate.add(0);
  } else {
    checkoutErrorRate.add(1);
  }
};
