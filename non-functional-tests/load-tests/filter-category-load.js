import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";
import { getRandomCategory } from "./utils.js";

export const options = baseOptions;

export default () => {
  const url = `${BASE_URL}/api/v1/product/product-category/${getRandomCategory()}`;
  const res = http.get(url);
  check(res, { "status was 200": (r) => r.status == 200 });
};
