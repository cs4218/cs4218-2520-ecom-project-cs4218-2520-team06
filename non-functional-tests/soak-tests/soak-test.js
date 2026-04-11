// Kok Bo Chang, A0273542E
import { sleep } from "k6";

import { runUserFlow } from "./flows/flow-router.js";
import { TEMP_FILE, TEMP_USER } from "./config/constants.js";
import { metrics } from "./config/metrics.js";

// -----------------------------
// Load seeded users (init stage)
// -----------------------------
const filePath = `../../temp/${TEMP_FILE.fileName}`;
const seededUserEmails = JSON.parse(open(filePath));

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
        { duration: "5m", target: 200 },
        { duration: "5m", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
    global_error_rate: ["rate<0.05"],
    checkout_error_rate: ["rate<0.05"],
    login_error_rate: ["rate<0.05"],
  },
  summaryTrendStats: [
    "avg",
    "min",
    "max",
    "med",
    "p(25)",
    "p(50)",
    "p(75)",
    "p(90)",
    "p(95)",
  ],
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
    let isSeeded = (__VU % 100) < 80;

    let email;
    if (isSeeded) {
        email = getSeededUser(__VU, userEmails);
    } else {
        // temp users (new registrations)
        email = createTempEmail(__VU, __ITER);
    }

    try {
        runUserFlow(isSeeded, email, metrics);
        metrics.error.global.add(false);
    } catch (err) {
        console.log(err);
        metrics.error.global.add(true);
    }

    sleep(1);
}

function getSeededUser(vuId, users) {
    return users[vuId % users.length];
}

function createTempEmail(vuId, iter) {
    return `${TEMP_USER.EMAIL_PREFIX}-${vuId}-${iter}@${TEMP_USER.EMAIL_DOMAIN}`;
}