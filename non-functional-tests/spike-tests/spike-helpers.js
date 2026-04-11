// Jabez Tho, A0273312N
import http from "k6/http";
import { check } from "k6";

export const BASE_URL = "http://localhost:6060";
export const SEARCH_KEYWORD = "law";
export const PASSWORD = "password123";
export const USER_POOL_SIZE = 1500;
export const MOCK_PAYMENT_PATH = "/api/v1/product/mock/payment";

export function parseJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export function registerUser(email, registrationDuration) {
  const payload = JSON.stringify({
    name: "Spike Test User",
    email: email,
    password: PASSWORD,
    phone: "1234567890",
    address: "123 Spike Test St",
    answer: "example",
  });
  const params = { headers: { "Content-Type": "application/json" } };

  const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, params);
  registrationDuration.add(res.timings.duration);

  const body = parseJson(res);

  const success = check(res, {
    "registration status is 201": (r) => r.status === 201,
    "registration success field is true": () => body?.success === true,
  });

  return success;
}

export function loginUser(email, loginDuration) {
  const payload = JSON.stringify({ email: email, password: PASSWORD });
  const params = { headers: { "Content-Type": "application/json" } };

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, params);
  loginDuration.add(res.timings.duration);

  const body = parseJson(res);

  const success = check(res, {
    "login status is 200": (r) => r.status === 200,
    "login has token": () => body?.token !== undefined,
  });

  return success ? body.token : null;
}

export function viewProfile(token, profileDuration) {
  const params = {
    headers: {
      Authorization: token,
    },
  };

  const res = http.get(`${BASE_URL}/api/v1/auth/user-auth`, params);
  profileDuration.add(res.timings.duration);
  const body = parseJson(res);

  return check(res, {
    "profile status is 200": (r) => r.status === 200,
    "profile auth ok": () => body?.ok === true,
  });
}

export function searchProduct(searchDuration) {
  const res = http.get(`${BASE_URL}/api/v1/product/search/${SEARCH_KEYWORD}`);
  searchDuration.add(res.timings.duration);

  const products = parseJson(res);
  const hasProducts = check(res, {
    "search status is 200": (r) => r.status === 200,
    "search results not empty": (r) =>
      Array.isArray(products) && products.length > 0,
  });

  if (!hasProducts) return null;

  return products[0];
}

export function checkout(token, product, checkoutDuration) {
  const payload = JSON.stringify({
    cart: [product],
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  };

  const res = http.post(`${BASE_URL}${MOCK_PAYMENT_PATH}`, payload, params);
  checkoutDuration.add(res.timings.duration);

  const body = parseJson(res);

  const success = check(res, {
    "mock payment status is 200": (r) => r.status === 200,
    "mock payment success is true": () => body?.success === true,
  });

  return success;
}
