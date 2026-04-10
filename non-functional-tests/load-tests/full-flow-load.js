import { baseOptions } from "./base-load.js";
import loadHomepage from "./home-load.js";
import login from "./login-load.js";
import search from "./search-load.js";
import filterCategory from "./filter-category-load.js";
import filterPrice from "./filter-price-load.js";
import loadProduct from "./product-load.js";
import checkout from "./checkout-load.js";
import { getRandomBetween } from "./utils.js";

export const options = baseOptions;

const FILTER_CATEGORY = 1;
const FILTER_PRICE = 2;
const SEARCH = 3;

export default () => {
  loadHomepage();
  login();
  switch (getRandomBetween(1, 3)) {
    case FILTER_CATEGORY:
      filterCategory();
      break;
    case FILTER_PRICE:
      filterPrice();
      break;
    case SEARCH:
      search();
      break;
  }
  loadProduct();
  checkout();
};
