// Hans Delano, A0273456X
import http from "k6/http";
import { check, group } from "k6";
import {
  BASE_URL,
  registerAndLoginUser,
  randomEmail,
  registerUser,
  parseJson,
} from "./security-helpers.js";

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  group("Password validation policy checks", () => {
    const weakCases = [
      { password: "abcdefg", name: "too short" },
      { password: "alllowercase123", name: "no uppercase" },
      { password: "NoSpecialllll123", name: "no special character" },
      { password: "NoDigitttttt!", name: "no digit" },
    ];

    for (const testCase of weakCases) {
      const email = randomEmail("weak");
      const response = registerUser(email, testCase.password);

      check(response, {
        [`weak password rejected: ${testCase.name}`]: (r) =>
          r.status === 400 || r.status === 422,
      });
    }
  });

  group("Plain-text password not exposed by API", () => {
    const password = "StrongPass1!";
    const {
      token,
      response: loginResponse,
      body,
    } = registerAndLoginUser("strong", password);

    check(loginResponse, {
      "login succeeds": (r) => r.status === 200,
      "login response has no password field": () =>
        body?.user?.password === undefined,
      "login body does not contain raw password": (r) =>
        !(r.body || "").includes(password),
    });

    if (!token) {
      return;
    }

    const ordersResponse = http.get(`${BASE_URL}/api/v1/auth/orders`, {
      headers: { Authorization: token },
    });

    const ordersBody = parseJson(ordersResponse);
    check(ordersResponse, {
      "orders endpoint is reachable": (r) => r.status === 200,
      "orders payload has no password values": () =>
        JSON.stringify(ordersBody || {}).includes("password") === false,
    });
  });
}
