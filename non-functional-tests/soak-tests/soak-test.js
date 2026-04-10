import { sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

import { runUserFlow } from "./flows/flow-router.js";
import { TEMP_FILE, TEMP_USER } from "./config/constants.js";
import { metrics } from "./config/metrics.js";

// -----------------------------
// Load seeded users (init stage)
// -----------------------------
const filePath = `../../temp/${TEMP_FILE.fileName}`;
const seededUserEmails = JSON.parse(open(filePath));

// -----------------------------
// Metrics (you can expand later)
// -----------------------------
const errorRate = new Rate("error_rate");

// -----------------------------
// k6 options (soak test)
// -----------------------------
export const options = {
  scenarios: {
    soak_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "5m", target: 200 },
        { duration: "12h", target: 200 },
        { duration: "5m", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
    error_rate: ["rate<0.05"],
  },
};

// -----------------------------
// Setup: share seeded users
// -----------------------------
export function setup() {
    return {
        seededUserEmails,
    };
}

// -----------------------------
// Main user execution
// -----------------------------
export default function (data) {
    const userEmails = data.seededUserEmails;

    // deterministic split of 80% returning users and 20% new users
    const isSeeded = (__VU % 100) < 80;

    let email;
    if (isSeeded) {
        email = getSeededUser(__VU, userEmails);
    } else {
        // temp users (new registrations)
        email = createTempEmail(__VU, __ITER);
    }

    try {
        runUserFlow(isSeeded, email, metrics);
        metrics.errorRate.add(false);
    } catch (err) {
        console.log(err);
        metrics.errorRate.add(true);
    }

    sleep(1);
}

function getSeededUser(vuId, users) {
    return users[vuId % users.length];
}

function createTempEmail(vuId, iter) {
    return `${TEMP_USER.EMAIL_PREFIX}-${vuId}-${iter}@${TEMP_USER.EMAIL_DOMAIN}`;
}