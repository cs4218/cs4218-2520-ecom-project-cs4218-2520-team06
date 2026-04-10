// Import the http module to make HTTP requests. From this point, you can use `http` methods to make HTTP requests.
import http from 'k6/http';

// Import the sleep function to introduce delays. From this point, you can use the `sleep` function to introduce delays in your test script.
import { group, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

import {
    loginUser,
    searchProduct,
    checkout,
} from "./spike-helpers.js";

const USER_POOL_SIZE = 500;
const USER_EMAIL_PREFIX = "soak-user";
const USER_EMAIL_DOMAIN = "test.com";

// Metrics
const loginDuration = new Trend("login_duration");
const searchDuration = new Trend("search_duration");
const checkoutDuration = new Trend("checkout_duration");

const flowCompletedCounter = new Counter("flow_completed");
const errorRate = new Rate("error_rate");

export const options = {
    scenarios: {
        steady_soak_test: {
        executor: "ramping-vus",
        startVUs: 0,
        stages: [
            { duration: "5m", target: 500 },
            { duration: "1h", target: 500 },
            { duration: "5m", target: 0 },
        ],
        },
    },
    thresholds: {
        http_req_duration: ["p(95)<800"],   // 95% under 800ms
        error_rate: ["rate<0.05"],          // <5% errors
    },
};

export function setup() {
    return Array.from({ length: USER_POOL_SIZE }, (_, index) => ({
        email: `${USER_EMAIL_PREFIX}-${index}@${USER_EMAIL_DOMAIN}`,
    }));
}

export default function (data) {
    const users = data || [];

    if (users.length === 0) {
        errorRate.add(true);
        return;
    }

    const user = users[(__VU + __ITER) % users.length];
    let success = false;

    group("User Journey", function () {
        // 1. Login (simulate /login)
        const token = loginUser(user.email, loginDuration);
        if (!token) return;

        sleep(Math.random() * 2); // think time

        // 2. Search (/search)
        const product = searchProduct(searchDuration);
        if (!product) return;

        sleep(Math.random() * 3);

        // 3. View product (/product/:slug)
        // (Assume searchProduct already hits this indirectly)

        // 4. Checkout (/cart → backend)
        const orderSuccess = checkout(token, product, checkoutDuration);
        if (!orderSuccess) return;

        sleep(Math.random() * 2);

        success = true;
        flowCompletedCounter.add(1);
    });

    errorRate.add(!success);
}

