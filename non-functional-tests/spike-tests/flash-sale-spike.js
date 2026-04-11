// Jabez Tho, A0273312N
import { sleep, group } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import {
  USER_POOL_SIZE,
  loginUser,
  searchProduct,
  checkout,
} from "./spike-helpers.js";

const USER_EMAIL_PREFIX = "flash-sale-user";
const USER_EMAIL_DOMAIN = "test.com";

const loginDuration = new Trend("login_duration");
const searchDuration = new Trend("search_duration");
const checkoutDuration = new Trend("checkout_duration");

const flashSaleScenarioCompleted = new Counter("flash_sale_scenario_completed");
const checkoutSuccessRate = new Rate("checkout_success_rate");

export const options = {
  scenarios: {
    flash_sale_spike: {
      exec: "flashSaleContentionSpike",
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 120 },
        { duration: "30s", target: 120 },
        { duration: "10s", target: 1200 },
        { duration: "2m", target: 1200 },
        { duration: "10s", target: 120 },
        { duration: "3m", target: 120 },
      ],
    },
  },
  summaryTrendStats: [
    "min",
    "max",
    "avg",
    "p(25)",
    "p(50)",
    "p(75)",
    "p(90)",
    "p(95)",
  ],
  setupTimeout: "5m",
};

export function setup() {
  return Array.from({ length: USER_POOL_SIZE }, (_, index) => ({
    email: `${USER_EMAIL_PREFIX}-${index}@${USER_EMAIL_DOMAIN}`,
  }));
}

export function flashSaleContentionSpike(data) {
  const users = data || [];

  if (users.length === 0) {
    checkoutSuccessRate.add(false);
    return;
  }

  const user = users[(__VU + __ITER) % users.length];
  let flowCompleted = false;

  group("Flash Sale Spike", function () {
    const token = loginUser(user.email, loginDuration);
    if (!token) return;
    sleep(Math.random() * 4 + 1);

    const searchedProduct = searchProduct(searchDuration);
    if (!searchedProduct) return;
    sleep(Math.random() * 4 + 1);

    // Skip adding to cart since its purely client side

    const orderSuccess = checkout(token, searchedProduct, checkoutDuration);
    if (!orderSuccess) return;

    flowCompleted = true;
    flashSaleScenarioCompleted.add(1);
  });

  checkoutSuccessRate.add(flowCompleted);
}
