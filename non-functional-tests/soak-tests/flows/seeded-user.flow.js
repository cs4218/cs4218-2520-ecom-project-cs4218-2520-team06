import { 
  login,
  viewProfile
} from "../api/auth.api.js";

import {
  viewProductList,
  viewProductDetails,
  searchForProduct,
  checkout,
  viewProductPhoto,
  getRelatedProducts,
} from "../api/product.api.js";

import {
  getAllCategories,
  getCategoryBySlug,
} from "../api/category.api.js";

import {
  getRandomPageNumber,
  getRandomProduct,
} from "../config/productDataset.js";

import { sleep } from "k6";

export function seededUserFlow(email, metrics) {
  const token = login(email, metrics.auth.login);
  if (!token) return;

  gaussianThink(2.5, 1.0);

  const isOk = viewProfile(token, metrics.auth.profile);
  if (!isOk) return;

  gaussianThink(2.5, 1.0);

  // View categories
  const categories = getAllCategories(metrics.category.list);
  
  let selectedCategory = null;
  if (categories && categories.length > 0) {
      selectedCategory = categories[Math.floor(Math.random() * categories.length)];

      // simulate user clicking a category page
      getCategoryBySlug(selectedCategory.slug, metrics.category.detail);
  }

  gaussianThink(2.5, 1.0);  

  // View product list
  const page = getRandomPageNumber();
  const products = viewProductList(page, metrics.product.list);
  if (!products || products.length === 0) return;

  gaussianThink(2.5, 1.0);

  // pick a random product
  const baseProduct = products[Math.floor(Math.random() * products.length)];
  // Optional search behaviour
  if (Math.random() < 0.3) {
    const searchResult = searchForProduct(
      getRandomProduct().searchTerm,
      metrics.product.search
    );

    gaussianThink(4, 1.5);

    // optionally override product choice if search succeeds
    if (searchResult) {
      baseProduct.slug = searchResult.slug;
    }
  }

  // -----------------------------
  // Product detail view
  // -----------------------------
  const product = viewProductDetails(
    baseProduct.slug,
    metrics.product.detail
  );
  if (!product) return;
  viewProductPhoto(product._id, metrics.product.detail);
  getRelatedProducts(product._id, product.category._id, metrics.product.related);

  gaussianThink(4, 1.5);

  // -----------------------------
  // Checkout (higher for returning users)
  // -----------------------------
  if (Math.random() < 0.2) {
    const isSuccess = checkout(token, product, metrics.checkout.order);
    metrics.checkout.rate.add(isSuccess);
    gaussianThink(6, 2.5);
  }
}

// -----------------------------
// Think time helper
// -----------------------------
export function gaussianThink(mean = 3, stdDev = 1) {
  let u1 = Math.random();
  let u2 = Math.random();

  let z = Math.sqrt(-2.0 * Math.log(u1)) *
          Math.cos(2.0 * Math.PI * u2);

  let value = mean + z * stdDev;

  // prevent negative sleep
  if (value < 0) value = 0;

  sleep(value);
}