// Kok Bo Chang, A0273542E
import http from "k6/http";
import { check } from "k6";
import { TEMP_USER, BASE_URL } from "../config/constants.js";
import { parseJson } from "../utils/parse-json.js";

export function register(email, metric) {
    const payload = JSON.stringify({
        name: TEMP_USER.DEFAULT_NAME,
        email: email,
        password: TEMP_USER.PASSWORD,
        phone: TEMP_USER.PHONE_NUMBER,
        address: TEMP_USER.ADDRESS,
        answer: TEMP_USER.ANSWER,
    });
    const params = { headers: { "Content-Type": "application/json" } };

    const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, params);
    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isSuccess = check(res, {
        "registration status is 201": (r) => r.status === 201,
        "registration success field is true": () => body?.success === true,
    });

    return isSuccess;
}

export function login(email, metric) {
    const payload = JSON.stringify({ email: email, password: TEMP_USER.PASSWORD });
    const params = { headers: { "Content-Type": "application/json" } };

    const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, params);
    metric.add(res.timings.duration);

    const body = parseJson(res);

    const isSuccess = check(res, {
        "login status is 200": (r) => r.status === 200,
        "login has token": () => body?.token !== undefined,
    });

    return isSuccess ? body.token : null;
}

export function viewProfile(token, metric) {
    const params = {
        headers: {
            Authorization: token,
        },
    };

    const res = http.get(`${BASE_URL}/api/v1/auth/user-auth`, params);
    metric.add(res.timings.duration);
    const body = parseJson(res);

    return check(res, {
        "profile status is 200": (r) => r.status === 200,
        "profile auth ok": () => body?.ok === true,
    });
}