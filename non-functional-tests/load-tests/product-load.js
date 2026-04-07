import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";
import { getRandomBetween } from "./utils.js";

export const options = baseOptions;

export default () => {
  const productCountResponse = http
    .get(`${BASE_URL}/api/v1/product/product-count`)
    .json();
  check(productCountResponse, {
    "product count response was 200": (r) => r.status == 200,
  });
  const productCount = productCountResponse.total;
  const pageSize = 6;
  const page = getRandomBetween(1, Math.ceil(productCount / pageSize));
  const url = `${BASE_URL}/api/v1/product/product-list/${page}`;
  const params = { headers: { "Content-Type": "application/json" } };
  const res = http.get(url, params);
  check(res, { "status was 200": (r) => r.status == 200 });
};
