// Kok Bo Chang, A0273542E
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

import { gaussianThink } from "../utils/gaussian-think.js";

export function newUserFlow(email, metrics) {
    // Register
    const registered = register(email, metrics.auth.register);
    if (!registered) {
        throw new Error("Registration failed");
    }

    gaussianThink(2.5, 1.0);

    // Login
    const token = login(email, metrics.auth.login);
    if (!token) {
        metrics.error.login.add(true);
        throw new Error("Login failed");
    } else {
        metrics.error.login.add(false);
    }

    gaussianThink(2.5, 1.0);

    // View profile
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
    viewProductPhoto(product._id, metrics.product.photo);
    getRelatedProducts(product._id, product.category._id, metrics.product.related);

    gaussianThink(4, 1.5);

    // Checkout (rarer for new users)
    const willCheckout = Math.random() < 0.05;
    if (!willCheckout) return;

    const isSuccess = checkout(token, product, metrics.checkout.order);
    metrics.error.checkout.add(!isSuccess);
    if (!isSuccess) {
        throw new Error("Checkout failed");
    }

    gaussianThink(6, 2.5);

    return;
}