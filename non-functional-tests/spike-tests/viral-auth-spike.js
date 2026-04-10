import { sleep, group } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import {
  registerUser,
  loginUser,
  viewProfile,
  searchProduct,
} from "./spike-helpers.js";

const registrationDuration = new Trend("registration_duration");
const loginDuration = new Trend("login_duration");
const profileDuration = new Trend("profile_duration");
const searchDuration = new Trend("search_duration");

const viralScenarioCompleted = new Counter("viral_auth_scenario_completed");
const viralJourneySuccessRate = new Rate("viral_journey_success_rate");

export const options = {
  scenarios: {
    viral_auth_spike: {
      exec: "viralAuthSpike",
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
};

export function viralAuthSpike() {
  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
  const email = `viral-spike-${uniqueId}@test.com`;

  let flowCompleted = false;

  group("Viral Auth Spike", function () {
    if (!registerUser(email, registrationDuration)) return;
    sleep(Math.random() * 4 + 1);
    const token = loginUser(email, loginDuration);
    if (!token) return;
    sleep(Math.random() * 4 + 1);
    if (!viewProfile(token, profileDuration)) return;
    sleep(Math.random() * 4 + 1);
    const product = searchProduct(searchDuration);
    if (!product) return;

    flowCompleted = true;
    viralScenarioCompleted.add(1);
  });

  viralJourneySuccessRate.add(flowCompleted);
}
