import auditLogModel from "../models/auditLogModel.js";

export const getAuditLogsController = async (req, res) => {
  try {
    const userId = req.user?._id;

    const logs = await auditLogModel
      .find(userId ? { userId } : {})
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();

    return res.status(200).send({
      success: true,
      logs,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error while fetching audit logs",
      error: error?.message,
    });
  }
};
