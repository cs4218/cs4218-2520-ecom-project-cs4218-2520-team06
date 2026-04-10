// Gabriel Chang, A0276978Y
import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";
import { getRandomBetween } from "./utils.js";
import { Rate, Trend, Counter } from "k6/metrics";

const productLoadErrorRate = new Rate("product_load_error_rate");
const productLoadDuration = new Trend("product_load_duration", true);
const successfulProductLoads = new Counter("successful_product_loads");

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
    const productRes = http.get(
      `${BASE_URL}/api/v1/product/get-product/${product.slug}`,
      params
    );
    productLoadDuration.add(productRes.timings.duration);
    const productSuccessful = check(productRes, {
      "server responded": (r) => r.status == 200 || r.status == 404,
    });
    if (productSuccessful) {
      successfulProductLoads.add(1);
      productLoadErrorRate.add(0);
    } else {
      productLoadErrorRate.add(1);
    }
  }
};
