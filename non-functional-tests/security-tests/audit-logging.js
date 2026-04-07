// Hans Delano, A0273456X
import http from "k6/http";
import { check, group } from "k6";
import {
  BASE_URL,
  registerAndLoginUser,
  getFirstProduct,
  jsonHeaders,
  parseJson,
} from "./security-helpers.js";

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const { token, body } = registerAndLoginUser("story6");
  const product = getFirstProduct();
  const userId = body?.user?._id;

  check(token, {
    "token acquired": (value) => Boolean(value),
  });

  if (!token || !product) {
    return;
  }

  group("Story 6: trigger create/update/delete style actions", () => {
    const createAction = http.post(
      `${BASE_URL}/api/v1/product/mock/payment`,
      JSON.stringify({ cart: [product] }),
      jsonHeaders(token)
    );

    const updateAction = http.put(
      `${BASE_URL}/api/v1/auth/profile`,
      JSON.stringify({ address: `AuditAddress-${Date.now()}` }),
      jsonHeaders(token)
    );

    const deleteAttempt = http.del(
      `${BASE_URL}/api/v1/category/delete-category/fake-id`,
      null,
      {
        headers: { Authorization: token },
      }
    );

    check(createAction, {
      "create-like action executed": (r) => r.status === 200,
    });
    check(updateAction, {
      "update-like action executed": (r) => r.status === 200,
    });
    check(deleteAttempt, {
      "delete action blocked for non-admin": (r) =>
        r.status === 401 || r.status === 403,
    });
  });

  group("Story 6: verify audit log entry existence", () => {
    const auditResponse = http.get(`${BASE_URL}/api/v1/audit/logs`, {
      headers: { Authorization: token },
    });

    const auditBody = parseJson(auditResponse);
    const entries = Array.isArray(auditBody?.logs)
      ? auditBody.logs
      : Array.isArray(auditBody)
        ? auditBody
        : [];

    const hasUserEntry = entries.some((entry) => {
      const serialized = JSON.stringify(entry || {});
      return (
        serialized.includes(userId || "") &&
        serialized.toLowerCase().includes("timestamp")
      );
    });

    check(auditResponse, {
      "audit endpoint is available": (r) => r.status === 200,
      "audit entry exists with user and timestamp": () => hasUserEntry,
    });
  });
}
