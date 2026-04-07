// Hans Delano, A0273456X
import http from "k6/http";
import { check, group } from "k6";
import { BASE_URL, parseJson } from "./security-helpers.js";

export const options = {
  vus: 1,
  iterations: 1,
};

const searchPayloads = [
  "' OR 1=1 --",
  "DROP TABLE products;",
  "<script>alert(1)</script>",
  '{"$ne":null}',
];

const filterPayloads = [
  { checked: ["$ne"], radio: [0, 1000000] },
  { checked: [{ $ne: null }], radio: [0, 1000000] },
  { checked: ["electronics"], radio: [{ $gt: 0 }, { $lt: 999999 }] },
];

export default function () {
  const baselineResponse = http.get(`${BASE_URL}/api/v1/product/get-product`);
  const baselineBody = parseJson(baselineResponse);
  const baselineProducts = baselineBody?.products || [];

  group("Story 5: search endpoint injection probes", () => {
    for (const payload of searchPayloads) {
      const response = http.get(
        `${BASE_URL}/api/v1/product/search/${encodeURIComponent(payload)}`
      );
      const body = parseJson(response);

      check(response, {
        [`search payload does not crash endpoint: ${payload}`]: (r) =>
          r.status === 200,
        [`search payload does not return all products: ${payload}`]: () =>
          Array.isArray(body) && body.length < baselineProducts.length,
      });
    }
  });

  group("Story 5: filter endpoint injection probes", () => {
    for (const payload of filterPayloads) {
      const response = http.post(
        `${BASE_URL}/api/v1/product/product-filters`,
        JSON.stringify(payload),
        { headers: { "Content-Type": "application/json" } }
      );
      const body = parseJson(response);
      const products = body?.products || [];

      console.log(`Testing filter payload: ${JSON.stringify(payload)}`);
      console.log(
        `Reponse status: ${response.status}, products returned: ${response}`
      );
      check(response, {
        "filter payload does not crash endpoint": (r) =>
          r.status === 200 || r.status === 400,
        "filter payload does not broaden data access": () =>
          Array.isArray(products) && products.length < baselineProducts.length,
      });
    }
  });
}
