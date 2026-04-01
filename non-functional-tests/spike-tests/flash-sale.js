import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

const BASE_URL = "http://localhost:6060";
const SEARCH_KEYWORD = "law";
const MOCK_PAYMENT_PATH = "/api/v1/product/mock/payment";

const registrationTrend = new Trend("registration_duration");
const loginTrend = new Trend("login_duration");
const searchTrend = new Trend("search_duration");
const checkoutTrend = new Trend("checkout_duration");
const journeyCompleted = new Counter("flash_sale_scenario_completed");
const checkoutSuccessRate = new Rate("checkout_success_rate");

export const options = {
  scenarios: {
    flash_sale_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 500 },
        { duration: "10s", target: 5000 },
        { duration: "30s", target: 500 },
        { duration: "10s", target: 5000 },
        { duration: "30s", target: 500 },
        { duration: "10s", target: 5000 },
        { duration: "30s", target: 500 },
        { duration: "1m", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
    checkout_success_rate: ["rate>0.8"],
  },
};

function register(email) {
  const payload = JSON.stringify({
    name: "Flash Sale User",
    email: email,
    password: "password123",
    phone: "1234567890",
    address: "123 Spike Test St",
    answer: "example",
  });
  const params = { headers: { "Content-Type": "application/json" } };

  const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, params);
  registrationTrend.add(res.timings.duration);

  const success = check(res, {
    "registration status is 201": (r) => r.status === 201,
    "registration success field is true": (r) => r.json().success === true,
  });
  return success;
}

function login(email) {
  const payload = JSON.stringify({ email: email, password: "password123" });
  const params = { headers: { "Content-Type": "application/json" } };

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, params);
  loginTrend.add(res.timings.duration);

  const success = check(res, {
    "login status is 200": (r) => r.status === 200,
    "login has token": (r) => r.json().token !== undefined,
  });

  return success ? res.json().token : null;
}

function search() {
  const res = http.get(`${BASE_URL}/api/v1/product/search/${SEARCH_KEYWORD}`);
  searchTrend.add(res.timings.duration);

  const products = res.json();
  const hasProducts = check(res, {
    "search status is 200": (r) => r.status === 200,
    "search results not empty": (r) =>
      Array.isArray(products) && products.length > 0,
  });

  if (!hasProducts) return null;

  return products[0];
}

// Simulate checkout with a mocked payment endpoint to avoid external dependencies and focus on backend performance
function checkout(token, product) {
  const payload = JSON.stringify({
    cart: [product],
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  };

  const res = http.post(`${BASE_URL}${MOCK_PAYMENT_PATH}`, payload, params);
  checkoutTrend.add(res.timings.duration);

  const success = check(res, {
    "mock payment status is 200": (r) => r.status === 200,
    "mock payment success is true": (r) => r.json().success === true,
  });

  checkoutSuccessRate.add(success);
  return success;
}

export default function () {
  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
  const email = `spike-${uniqueId}@test.com`;

  group("Flash Sale", function () {
    if (!register(email)) return;
    sleep(1);

    const token = login(email);
    if (!token) return;
    sleep(1);

    const product = search();
    if (!product) return;
    sleep(1);

    // Skip add-to-cart (client side) but still hit checkout (that skips payment using a mocked endpoint)
    const orderSuccess = checkout(token, product);
    if (orderSuccess) journeyCompleted.add(1);
  });

  sleep(1);
}
