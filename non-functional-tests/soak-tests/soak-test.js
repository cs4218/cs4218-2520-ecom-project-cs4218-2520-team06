// Kok Bo Chang, A0273542E
import { sleep } from "k6";

import { runUserFlow } from "./flows/flow-router.js";
import { TEMP_FILE, TEMP_USER } from "./config/constants.js";
import { metrics } from "./config/metrics.js";

// Load seeded users during init stage
const filePath = `../../temp/${TEMP_FILE.fileName}`;
const seededUserEmails = JSON.parse(open(filePath));

export const options = {
  scenarios: {
    soak_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30m", target: 200 },
        { duration: "12h", target: 200 },
        { duration: "30m", target: 0 },
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

// Share seeded users during setup
export function setup() {
    return {
        seededUserEmails,
    };
}

// Main user function
export default function (data) {
    const userEmails = data.seededUserEmails;

    // deterministic split of 90% returning users and 10% new users
    const isSeeded = (__VU % 100) < 90;

    let email;
    if (isSeeded) {
        email = getSeededUser(__VU, userEmails);
    } else {
        // temp users use a new email to register
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