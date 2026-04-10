import http from "k6/http";
import { check } from "k6";
import { baseOptions } from "./base-load.js";
import { getRandomUserCredentials } from "./utils.js";
import { BASE_URL } from "./scripts/constants.js";

export const options = baseOptions;

const SEARCH_KEYWORD = "law";
export default () => {
  const url = `${BASE_URL}/api/v1/product/search/${SEARCH_KEYWORD}`;

  const res = http.get(url);
  check(res, { "status was 200": (r) => r.status == 200 });
};
