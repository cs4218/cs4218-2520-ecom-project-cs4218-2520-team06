// Hans Delano, A0273456X
import http from "k6/http";
import { check, group } from "k6";
import {
  BASE_URL,
  findHeader,
  registerAndLoginUser,
} from "./security-helpers.js";

export const options = {
  vus: 1,
  iterations: 1,
};

function checkForSecurityHeaders(response, path) {
  const csp = findHeader(response, "Content-Security-Policy");
  const hsts = findHeader(response, "Strict-Transport-Security");
  const noSniff = findHeader(response, "X-Content-Type-Options");
  const xFrame = findHeader(response, "X-Frame-Options");
  const allowOrigin = findHeader(response, "Access-Control-Allow-Origin");
  const allowCredentials = findHeader(
    response,
    "Access-Control-Allow-Credentials"
  );

  check(response, {
    [`${path} has Content-Security-Policy header`]: () => Boolean(csp),
    [`${path} has Strict-Transport-Security header`]: () => Boolean(hsts),
    [`${path} has nosniff`]: () => String(noSniff).toLowerCase() === "nosniff",
    [`${path} has X-Frame-Options`]: () => Boolean(xFrame),
    [`${path} has Access-Control-Allow-Origin`]: () => Boolean(allowOrigin),
    [`${path} no wildcard Access-Control-Allow-Origin when credentials true`]:
      () =>
        String(allowCredentials).toLowerCase() !== "true" ||
        allowOrigin !== "*",
  });
}

export default function () {
  group("Required security headers for GET", () => {
    const path = "/api/v1/product/get-product";
    const response = http.get(`${BASE_URL}${path}`);

    checkForSecurityHeaders(response, path);
  });

  group("Required security headers for POST", () => {
    const response = registerAndLoginUser("header-test-user").response;

    checkForSecurityHeaders(response, "login");
  });
}
