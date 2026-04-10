// Gabriel Chang, A0276978Y
import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";
import { Rate, Trend, Counter } from "k6/metrics";

export const options = baseOptions;

const searchErrorRate = new Rate("search_error_rate");
const searchDuration = new Trend("search_duration", true);
const successfulSearches = new Counter("successful_searches");

const SEARCH_KEYWORD = "law";
export default () => {
  const url = `${BASE_URL}/api/v1/product/search/${SEARCH_KEYWORD}`;

  const res = http.get(url);
  searchDuration.add(res.timings.duration);

  const searchSuccessful = check(res, {
    "status was 200": (r) => r.status == 200,
  });

  if (searchSuccessful) {
    successfulSearches.add(1);
    searchErrorRate.add(0);
  } else {
    searchErrorRate.add(1);
  }
};
