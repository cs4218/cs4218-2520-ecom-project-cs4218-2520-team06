import { loadTestBasic, baseOptions } from "./base-load.js";
import { BASE_URL } from "./scripts/constants.js";

export const options = baseOptions;

export default () => {
  loadTestBasic(
    `${BASE_URL}/api/v1/category/get-category`,
    `${BASE_URL}/api/v1/product/product-count`
  );
};
