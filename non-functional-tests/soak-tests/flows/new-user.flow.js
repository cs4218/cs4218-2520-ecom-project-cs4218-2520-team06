import {
    register,
    login,
    viewProfile
} from "../api/auth.api.js";

import {
  viewProductList,
  viewProductDetails,
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

export function newUserFlow(email, metrics) {
    // 1. Register
    const registered = register(email, metrics.auth.register);
    if (!registered) return;

    gaussianThink(2.5, 1.0);

    // 2. Login
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

    // Browse product listings
    const browseSessions = 1 + Math.floor(Math.random() * 3);
    let lastProduct = null;
    for (let i = 0; i < browseSessions; i++) {
        const page = getRandomPageNumber();
        const products = viewProductList(page, metrics.product.list);

        gaussianThink(2.5, 1.0);

        if (products && products.length > 0) {
            lastProduct = products[Math.floor(Math.random() * products.length)];
        }
    }

    gaussianThink(2.5, 1.0);

    // View product details
    const productToView = lastProduct || getRandomProduct();
    const product = viewProductDetails(
        productToView.slug,
        metrics.product.detail
    );
    if (!product) return;
    viewProductPhoto(product._id, metrics.product.detail);
    getRelatedProducts(product._id, product.category._id, metrics.product.related);

    gaussianThink(4, 1.5);

    // Checkout (rarer for new users)
    const willCheckout = Math.random() < 0.1;
    if (willCheckout) {
        const isSuccess = checkout(token, product, metrics.checkout.order);
        metrics.checkout.rate.add(isSuccess);
        gaussianThink(6, 2.5);
    }

    return;
}

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