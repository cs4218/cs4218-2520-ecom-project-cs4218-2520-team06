import http from "k6/http";
import { check } from "k6";
import { BASE_URL, PRODUCT_API } from "../config/constants";
import { parseJson } from "../utils/parse";

export function viewProductList(page, metric) {
    const res = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`);
    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isValid = check(res, {
        "product list status 200": (r) => r.status === 200,
        "product list not empty": () =>
        body?.products && Array.isArray(body.products),
    });

    if (!isValid) return null;

    return body.products;
}

export function viewProductDetails(slug, metric) {
    const res = http.get(`${BASE_URL}/api/v1/product/get-product/${slug}`);
    metric.add(res.timings.duration);

    const body = parseJson(res);
    if (!body || !body.product) {
        return null;
    }

    const isSuccess = check(res, {
        "status of view product is 200": (r) => r.status === 200,
        "product exists": () => body?.product !== undefined,
    });

    if (!isSuccess) return null;

    return body.product;
}

export function searchForProduct(term, metric) {
    const res = http.get(`${BASE_URL}/api/v1/product/search/${term}`);
    metric.add(res.timings.duration);

    const products = parseJson(res);
    const hasProducts = check(res, {
        "search status is 200": (r) => r.status === 200,
        "search results not empty": (r) =>
        Array.isArray(products) && products.length > 0,
    });

    if (!hasProducts) return null;

    return products[0];
}

export function filterProducts(filterPayload, metric) {
    const params = {
        headers: { "Content-Type": "application/json" },
    };

    const res = http.post(
        `${BASE_URL}/api/v1/product/product-filters`,
        JSON.stringify(filterPayload),
        params
    );

    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isValid = check(res, {
        "filter status 200": (r) => r.status === 200,
        "filter returns products": () => Array.isArray(body),
    });

    if (!isValid) return null;

    return body;
}

export function getRelatedProducts(pid, cid, metric) {
    const res = http.get(
        `${BASE_URL}/api/v1/product/related-product/${pid}/${cid}`
    );

    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isValid = check(res, {
        "related products status 200": (r) => r.status === 200,
        "related products valid": () => Array.isArray(body),
    });

    if (!isValid) return null;

    return body;
}

export function viewProductPhoto(pid, metric) {
    const res = http.get(`${BASE_URL}/api/v1/product/product-photo/${pid}`);
    metric.add(res.timings.duration);

    return check(res, {
        "photo status is valid (200 or 404)": (r) => r.status === 200 || r.status === 404,
    });
}

export function getProductCategory(slug, metric) {
    const res = http.get(`${BASE_URL}/api/v1/product/product-category/${slug}`);
    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isValid = check(res, {
        "category products status 200": (r) => r.status === 200,
        "category has products": () =>
        body?.products && Array.isArray(body.products),
    });

    if (!isValid) return null;

    return body.products;
}

export function getProductCount(metric) {
    const res = http.get(`${BASE_URL}/api/v1/product/product-count`);
    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isValid = check(res, {
        "product count status 200": (r) => r.status === 200,
        "product count exists": () => typeof body?.total === "number",
    });

    if (!isValid) return null;

    return body.total;
}

export function checkout(token, product, metric) {
    const payload = JSON.stringify({
        cart: [product],
    });

    const params = {
        headers: {
            "Content-Type": "application/json",
            Authorization: token,
        },
    };

    const res = http.post(`${BASE_URL}${PRODUCT_API.MOCK_PAYMENT_PATH}`, payload, params);
    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isSuccess = check(res, {
        "mock payment status is 200": (r) => r.status === 200,
        "mock payment success is true": () => body?.success === true,
    });

    return isSuccess;
}