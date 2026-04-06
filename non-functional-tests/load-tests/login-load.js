import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { getRandomUserCredentials } from "./utils.js";
import { BASE_URL } from "./scripts/constants.js";

export const options = baseOptions;

export default () => {
  const credentials = getRandomUserCredentials();
  const url = `${BASE_URL}/api/v1/auth/login`;
  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password,
  });
  const params = { headers: { "Content-Type": "application/json" } };

  const res = http.post(url, payload, params);
  check(res, { "status was 200": (r) => r.status == 200 });
};
