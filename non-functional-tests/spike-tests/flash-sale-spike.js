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
    flash_sale_contention_spike: {
      exec: "flashSaleContentionSpike",
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 500 },
        { duration: "10s", target: 5000 },
        { duration: "30s", target: 5000 },
        { duration: "1m", target: 0 },
      ],
    },
  },
  setupTimeout: "5m",
  thresholds: {
    "http_req_failed{scenario:flash_sale_contention_spike}": ["rate<0.05"],
    "http_req_duration{scenario:flash_sale_contention_spike}": ["p(95)<2000"],
    checkout_success_rate: ["rate>0.8"],
  },
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
    sleep(0.3 + Math.random() * 0.7);

    const searchedProduct = searchProduct(searchDuration);
    if (!searchedProduct) return;
    sleep(0.2 + Math.random() * 0.8);

    // Skip adding to cart since its purely client side

    const orderSuccess = checkout(
      token,
      searchedProduct,
      checkoutDuration,
      checkoutSuccessRate
    );
    if (!orderSuccess) return;

    flowCompleted = true;
    flashSaleScenarioCompleted.add(1);
  });

  checkoutSuccessRate.add(flowCompleted);
}
