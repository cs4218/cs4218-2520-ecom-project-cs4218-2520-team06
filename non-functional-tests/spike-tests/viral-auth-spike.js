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
        { duration: "1m", target: 500 },
        { duration: "10s", target: 5000 },
        { duration: "30s", target: 5000 },
        { duration: "1m", target: 0 },
      ],
    },
  },
  thresholds: {
    "http_req_failed{scenario:viral_auth_spike}": ["rate<0.05"],
    "http_req_duration{scenario:viral_auth_spike}": ["p(95)<2000"],
    viral_journey_success_rate: ["rate>0.8"],
  },
};

export function viralAuthSpike() {
  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
  const email = `viral-spike-${uniqueId}@test.com`;

  let flowCompleted = false;

  group("Viral Auth Spike", function () {
    if (!registerUser(email, registrationDuration)) return;
    sleep(0.3 + Math.random() * 0.7);

    const token = loginUser(email, loginDuration);
    if (!token) return;
    sleep(0.3 + Math.random() * 0.7);

    if (!viewProfile(token, profileDuration)) return;
    sleep(0.4 + Math.random() * 0.8);

    const product = searchProduct(searchDuration);
    if (!product) return;

    flowCompleted = true;
    viralScenarioCompleted.add(1);
  });

  viralJourneySuccessRate.add(flowCompleted);
}
