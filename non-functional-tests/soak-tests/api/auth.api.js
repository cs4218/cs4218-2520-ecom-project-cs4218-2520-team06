import http from "k6/http";
import { check } from "k6";
import { AUTH, BASE_URL } from "../config/constants";

export function register(email, registrationDuration) {
    const payload = JSON.stringify({
        name: AUTH.DEFAULT_NAME,
        email: email,
        password: AUTH.PASSWORD,
        phone: AUTH.PHONE_NUMBER,
        address: AUTH.ADDRESS,
        answer: AUTH.ANSWER,
    });
    const params = { headers: { "Content-Type": "application/json" } };

    const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, params);
    registrationDuration.add(res.timings.duration);

    const body = parseJson(res);

    const isSuccess = check(res, {
        "registration status is 201": (r) => r.status === 201,
        "registration success field is true": () => body?.success === true,
    });

    return isSuccess;
}

export function login(email, loginDuration) {
    const payload = JSON.stringify({ email: email, password: AUTH.PASSWORD });
    const params = { headers: { "Content-Type": "application/json" } };

    const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, params);
    loginDuration.add(res.timings.duration);

    const body = parseJson(res);

    const isSuccess = check(res, {
        "login status is 200": (r) => r.status === 200,
        "login has token": () => body?.token !== undefined,
    });

    return isSuccess ? body.token : null;
}

// USER NAVIGATION ACTIONS THAT LEAD TO THE LOADING OF DATA
export function viewProfile(token, profileDuration) {
    const params = {
        headers: {
            Authorization: token,
        },
    };

    const res = http.get(`${BASE_URL}/api/v1/auth/user-auth`, params);
    profileDuration.add(res.timings.duration);
    const body = parseJson(res);

    return check(res, {
        "profile status is 200": (r) => r.status === 200,
        "profile auth ok": () => body?.ok === true,
    });
}