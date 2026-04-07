import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";
import { getRandomPriceRange } from "./utils.js";

export const options = baseOptions;

export default () => {
  const url = `${BASE_URL}/api/v1/product/product-filters`;
  const priceRange = getRandomPriceRange();
  const payload = JSON.stringify({
    radio: priceRange,
  });
  const params = { headers: { "Content-Type": "application/json" } };
  const res = http.post(url, payload, params);
  check(res, { "status was 200": (r) => r.status == 200 });
};
