// Gabriel Chang, A0276978Y
import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { getRandomUserCredentials } from "./utils.js";
import { BASE_URL } from "./scripts/constants.js";
import { Rate, Trend, Counter } from "k6/metrics";

export const options = baseOptions;

const loginErrorRate = new Rate("login_error_rate");
const loginDuration = new Trend("login_duration", true);
const successfulLogins = new Counter("successful_logins");

export default () => {
  const credentials = getRandomUserCredentials();
  const url = `${BASE_URL}/api/v1/auth/login`;
  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password,
  });
  const params = { headers: { "Content-Type": "application/json" } };

  const res = http.post(url, payload, params);

  loginDuration.add(res.timings.duration);

  const loginSuccessful = check(res, {
    "status was 200": (r) => r.status == 200,
  });

  if (loginSuccessful) {
    successfulLogins.add(1);
    loginErrorRate.add(0);
  } else {
    loginErrorRate.add(1);
  }
};
