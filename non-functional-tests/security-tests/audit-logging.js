// Hans Delano, A0273456X
import http from "k6/http";
import { check, group, sleep } from "k6";
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

function fetchAuditEntries(token) {
  const auditResponse = http.get(`${BASE_URL}/api/v1/audit/logs`, {
    headers: { Authorization: token },
  });
  const auditBody = parseJson(auditResponse);
  const entries = Array.isArray(auditBody?.logs) ? auditBody.logs : [];

  return { auditResponse, entries };
}

function matchesExpectedEntry(entry, expected, userId) {
  return (
    entry?.userId === userId &&
    entry?.method === expected.method &&
    entry?.action === expected.action &&
    entry?.path === expected.pathFragment &&
    entry?.statusCode === expected.statusCode
  );
}

export default function () {
  const { token, body } = registerAndLoginUser("audit-logging");
  const product = getFirstProduct();
  const userId = body?.user?._id;
  const auditRunId = `audit-${Date.now()}`;
  const profilePath = `/api/v1/auth/profile?auditRun=${auditRunId}`;
  const paymentPath = `/api/v1/product/mock/payment?auditRun=${auditRunId}`;
  const deletePath = `/api/v1/category/delete-category/audit-${auditRunId}`;

  check(token, {
    "token acquired": (value) => Boolean(value),
  });

  if (!token || !product) {
    return;
  }

  group("Trigger create/update/delete style actions", () => {
    const createAction = http.post(
      `${BASE_URL}${paymentPath}`,
      JSON.stringify({ cart: [product] }),
      jsonHeaders(token)
    );

    const updateAction = http.put(
      `${BASE_URL}${profilePath}`,
      JSON.stringify({ address: `AuditAddress-${Date.now()}` }),
      jsonHeaders(token)
    );

    const deleteAttempt = http.del(
      `${BASE_URL}${deletePath}`,
      null,
      jsonHeaders(token)
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

  group("Verify audit middleware entries", () => {
    const expectedEntries = [
      {
        method: "POST",
        action: "create",
        statusCode: 200,
        success: true,
        pathFragment: paymentPath,
      },
      {
        method: "PUT",
        action: "update",
        statusCode: 200,
        success: true,
        pathFragment: profilePath,
      },
      {
        method: "DELETE",
        action: "delete",
        statusCode: 401,
        success: false,
        pathFragment: deletePath,
      },
    ];

    const { auditResponse, entries } = fetchAuditEntries(token);

    check(auditResponse, {
      "audit endpoint is available": (r) => r?.status === 200,
      "audit middleware recorded at least one expected entry": () =>
        entries.length > 0,
      "audit logs are scoped to the current user": () =>
        entries.every(
          (entry) =>
            !entry?.userId || String(entry.userId) === String(userId || "")
        ),
    });

    for (const expected of expectedEntries) {
      check(entries, {
        [`audit log exists for ${expected.method} ${expected.pathFragment}`]:
          () =>
            entries.some((entry) =>
              matchesExpectedEntry(entry, expected, userId)
            ),
      });
    }
  });
}
