// Hans Delano, A0273456X
import http from "k6/http";
import { check, group } from "k6";
import {
  BASE_URL,
  registerAndLoginUser,
  jsonHeaders,
} from "./security-helpers.js";

export const options = {
  vus: 1,
  iterations: 1,
};

const adminEndpoints = [
  { method: "GET", path: "/api/v1/auth/all-users" },
  { method: "GET", path: "/api/v1/auth/all-orders" },
  {
    method: "POST",
    path: "/api/v1/category/create-category",
    body: { name: "forbidden-category" },
  },
];

function callWithToken(method, path, token, body) {
  if (method === "POST") {
    return http.post(
      `${BASE_URL}${path}`,
      JSON.stringify(body || {}),
      jsonHeaders(token)
    );
  } else if (method === "GET") {
    return http.get(`${BASE_URL}${path}`, {
      headers: { Authorization: token },
    });
  } else {
    throw new Error(`Unsupported method: ${method}`);
  }
}

export default function () {
  const { token } = registerAndLoginUser("basic-user");

  check(token, {
    "regular user token acquired": (value) => Boolean(value),
  });

  if (!token) {
    return;
  }

  group("Non-privileged user cannot access admin endpoints", () => {
    for (const endpoint of adminEndpoints) {
      const response = callWithToken(
        endpoint.method,
        endpoint.path,
        token,
        endpoint.body
      );

      check(response, {
        [`${endpoint.path} not successful for regular user`]: (r) =>
          r.status !== 200,
      });
    }
  });

  group("Unauthenticated access is rejected", () => {
    const response = http.get(`${BASE_URL}/api/v1/auth/all-users`);
    check(response, {
      "missing token returns 401": (r) => r.status === 401,
    });
  });
}
