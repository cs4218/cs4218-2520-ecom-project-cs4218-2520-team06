// Gabriel Chang, A0276978Y
import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";
import { getRandomCategory } from "./utils.js";
import { Rate, Trend, Counter } from "k6/metrics";

export const options = baseOptions;

const categoryErrorRate = new Rate("category_error_rate");
const categoryDuration = new Trend("category_duration", true);
const successfulCategoryFetches = new Counter("successful_category_fetches");

export default () => {
  const url = `${BASE_URL}/api/v1/product/product-category/${getRandomCategory()}`;
  const res = http.get(url);
  categoryDuration.add(res.timings.duration);
  const categoryFetchSuccessful = check(res, {
    "filter category status was 200": (r) => r.status == 200,
  });
  if (categoryFetchSuccessful) {
    successfulCategoryFetches.add(1);
    categoryErrorRate.add(0);
  } else {
    categoryErrorRate.add(1);
  }
};
