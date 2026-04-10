import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "../config/constants.js";
import { parseJson } from "../utils/parse-json.js";

export function getAllCategories(metric) {
    const res = http.get(`${BASE_URL}/api/v1/category/get-category`);

    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isValid = check(res, {
        "get categories status 200": (r) => r.status === 200,
        "categories is array": () => Array.isArray(body?.category),
    });

    return isValid ? body.category : null;
}

export function getCategoryBySlug(slug, metric) {
    const res = http.get(
        `${BASE_URL}/api/v1/category/single-category/${slug}`
    );

    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isValid = check(res, {
        "single category status 200": (r) => r.status === 200,
        "category exists": () => body?.category !== undefined,
    });

    return isValid ? body.category : null;
}