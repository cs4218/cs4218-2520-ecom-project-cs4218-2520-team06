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

import { gaussianThink } from "../utils/gaussian-think.js";

export function createSeededUserFlow() {
  let token = null;

  return function seededUserFlow(email, metrics) {
    if (!token || Math.random() < 0.3) {
      // 20% chance of re-login (session expired / new device)
      token = login(email, metrics.auth.login);
      if (!token) {
        metrics.error.login.add(true);
        throw new Error("Login failed");
      }
      metrics.error.login.add(false);
    }

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
    viewProductPhoto(product._id, metrics.product.photo);
    getRelatedProducts(product._id, product.category._id, metrics.product.related);

    gaussianThink(4, 1.5);

    // -----------------------------
    // Checkout (higher for returning users)
    // -----------------------------
    const willCheckout = Math.random() < 0.3;
    if (!willCheckout) return;

    const isSuccess = checkout(token, product, metrics.checkout.order);
    metrics.error.checkout.add(!isSuccess);
    if (!isSuccess) {
      throw new Error("Checkout failed");
    }
    gaussianThink(6, 2.5);

    return;
  }
}