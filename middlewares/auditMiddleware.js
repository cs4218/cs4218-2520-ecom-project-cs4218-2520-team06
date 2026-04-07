import {
  getAuditActionFromMethod,
  writeAuditLog,
} from "../helpers/auditLogger.js";

const auditableMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const auditRequestMiddleware = (req, res, next) => {
  const method = String(req.method || "").toUpperCase();
  const isApiRoute = String(req.path || "").startsWith("/api/v1/");

  if (!isApiRoute || !auditableMethods.has(method)) {
    return next();
  }

  res.on("finish", () => {
    const action = getAuditActionFromMethod(method);
    const statusCode = res.statusCode;

    writeAuditLog({
      userId: req.user?._id || null,
      method,
      path: req.originalUrl || req.path,
      action,
      statusCode,
      success: statusCode >= 200 && statusCode < 400,
      metadata: {
        ip: req.ip,
      },
    });
  });

  next();
};
