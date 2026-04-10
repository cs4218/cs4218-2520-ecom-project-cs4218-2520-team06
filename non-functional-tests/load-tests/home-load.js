// Gabriel Chang, A0276978Y
import { loadTestBasic, baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";
import { Rate, Trend, Counter } from "k6/metrics";

export const options = baseOptions;

const homePageErrorRate = new Rate("home_page_error_rate");
const homePageDuration = new Trend("home_page_duration", true);
const successfulHomePageLoads = new Counter("successful_home_page_loads");

export default () => {
  const results = loadTestBasic(
    `${BASE_URL}/api/v1/category/get-category`,
    `${BASE_URL}/api/v1/product/product-count`
  );

  results.forEach(({ success, duration }) => {
    homePageDuration.add(duration);
    if (success) {
      successfulHomePageLoads.add(1);
      homePageErrorRate.add(0);
    } else {
      homePageErrorRate.add(1);
    }
  });
};
