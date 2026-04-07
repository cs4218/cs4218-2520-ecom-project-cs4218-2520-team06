import auditLogModel from "../models/auditLogModel.js";

const methodToAction = {
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
};

export const getAuditActionFromMethod = (method = "") => {
  return methodToAction[String(method).toUpperCase()] || "unknown";
};

export const writeAuditLog = async ({
  userId = null,
  method,
  path,
  action,
  statusCode,
  success,
  metadata = {},
}) => {
  if (!method || !path || !action || typeof statusCode !== "number") {
    return;
  }

  try {
    await auditLogModel.create({
      userId,
      method,
      path,
      action,
      statusCode,
      success,
      timestamp: new Date(),
      metadata,
    });
  } catch (error) {
    // Logging must never block request lifecycle.
    console.error("Audit log write failed:", error?.message || error);
  }
};
