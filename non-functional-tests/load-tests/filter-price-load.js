// Gabriel Chang, A0276978Y
import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";
import { getRandomPriceRange } from "./utils.js";
import { Rate, Trend, Counter } from "k6/metrics";

const priceFilterErrorRate = new Rate("price_filter_error_rate");
const priceFilterDuration = new Trend("price_filter_duration", true);
const successfulPriceFilters = new Counter("successful_price_filters");

export const options = baseOptions;

export default () => {
  const url = `${BASE_URL}/api/v1/product/product-filters`;
  const priceRange = getRandomPriceRange();
  const payload = JSON.stringify({
    radio: priceRange,
  });
  const params = { headers: { "Content-Type": "application/json" } };
  const res = http.post(url, payload, params);
  priceFilterDuration.add(res.timings.duration);
  const priceFilterSuccessful = check(res, {
    "filter price status was 200": (r) => r.status == 200,
  });
  if (priceFilterSuccessful) {
    successfulPriceFilters.add(1);
    priceFilterErrorRate.add(0);
  } else {
    priceFilterErrorRate.add(1);
  }
};
