import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";
import { getRandomBetween } from "./utils.js";

export const options = baseOptions;

export default () => {
  const productCountResponse = http.get(
    `${BASE_URL}/api/v1/product/product-count`
  );
  check(productCountResponse, {
    "product count response was 200": (r) => r.status == 200,
  });
  const productCount = productCountResponse.json().total;
  const pageSize = 6;
  const page = getRandomBetween(1, Math.ceil(productCount / pageSize));
  const url = `${BASE_URL}/api/v1/product/product-list/${page}`;
  const params = { headers: { "Content-Type": "application/json" } };
  const res = http.get(url, params);
  check(res, { "status was 200": (r) => r.status == 200 });
  const products = res.json().products;

  for (const product of products) {
    http.get(`${BASE_URL}/api/v1/product/product-photo/${product._id}`);
    check(res, {
      "server responded": (r) => r.status == 200 || r.status == 404,
    });
  }
};
