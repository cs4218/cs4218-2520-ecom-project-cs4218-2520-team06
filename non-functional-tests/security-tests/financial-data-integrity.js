// Hans Delano, A0273456X
import http from "k6/http";
import { check, group } from "k6";
import {
  BASE_URL,
  registerAndLoginUser,
  getFirstProduct,
  jsonHeaders,
  hasSensitiveCardData,
} from "./security-helpers.js";

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ["rate>0.9"],
  },
};

// Braintree test card details
const cardNumber = "4111111111111111";
const cvv = "333";
const expiry = "12/2030";

export default function () {
  const { token } = registerAndLoginUser("financial-integrity");

  const product = getFirstProduct();
  check(token, { "token acquired": (value) => Boolean(value) });
  check(product, { "product available": (value) => Boolean(value) });

  if (!token || !product) {
    return;
  }

  group("Check Credit Card data not exposed on Payment", () => {
    const paymentResponse = http.post(
      `${BASE_URL}/api/v1/product/braintree/payment`,
      JSON.stringify({
        nonce: "fake-valid-nonce",
        cart: [product],
        cardNumber,
        cvv,
        expirationDate: expiry,
      }),
      jsonHeaders(token)
    );

    const body = paymentResponse.body || "";
    check(paymentResponse, {
      "endpoint responds": (r) => r.status === 200 || r.status === 500,
      "response does not include raw card data": () =>
        !hasSensitiveCardData(body, [cardNumber, cvv, expiry]),
    });
  });

  group("Check Credit Card data not exposed in orders", () => {
    const mockPay = http.post(
      `${BASE_URL}/api/v1/product/mock/payment`,
      JSON.stringify({
        cart: [product],
        cardNumber,
        cvv,
        expirationDate: expiry,
      }),
      jsonHeaders(token)
    );

    check(mockPay, {
      "mock payment succeeds": (r) => r.status === 200,
    });

    const orders = http.get(`${BASE_URL}/api/v1/auth/orders`, {
      headers: { Authorization: token },
    });

    const body = orders.body || "";

    check(orders, {
      "orders endpoint succeeds": (r) => r.status === 200,
      "orders body has no sensitive values": (r) =>
        !hasSensitiveCardData(body, [cardNumber, cvv, expiry]),
    });
  });
}
