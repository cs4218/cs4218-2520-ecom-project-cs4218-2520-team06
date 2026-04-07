import http from "k6/http";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
export const PASSWORD = __ENV.SECURITY_TEST_PASSWORD || "Password123!";

export function parseJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export function randomEmail(prefix = "security") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@test.com`;
}

export function jsonHeaders(token) {
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  };
}

export function registerUser(email, password = PASSWORD) {
  return http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      name: "Security Test User",
      email,
      password,
      phone: "99999999",
      address: "Security Test Address",
      answer: "security-test",
    }),
    jsonHeaders()
  );
}

export function loginUser(email, password = PASSWORD) {
  const response = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    jsonHeaders()
  );
  const body = parseJson(response);
  return {
    response,
    body,
    token: body?.token || null,
  };
}

export function registerAndLoginUser(prefix = "security", password = PASSWORD) {
  const email = __ENV.SECURITY_TEST_EMAIL || randomEmail(prefix);

  if (!__ENV.SECURITY_TEST_EMAIL) {
    registerUser(email, password);
  }

  return loginUser(email, password);
}

export function getFirstProduct() {
  const response = http.get(`${BASE_URL}/api/v1/product/get-product`);
  const body = parseJson(response);
  const products = body?.products;

  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  return products[0];
}

export function findHeader(response, headerName) {
  const headers = response?.headers || {};
  const target = headerName.toLowerCase();

  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === target) {
      const value = headers[key];
      if (Array.isArray(value)) {
        return value.join(",");
      }
      return value;
    }
  }

  return "";
}

export function hasSensitiveCardData(text, values) {
  const raw = text || "";
  // output the values that are read
  values.forEach((value) => {
    if (raw.includes(value)) {
      console.log(`Sensitive data found: ${value}`);
    }
  });

  return values.some((value) => raw.includes(value));
}
