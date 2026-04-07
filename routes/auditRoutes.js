import express from "express";
import { getAuditLogsController } from "../controllers/auditController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/logs", requireSignIn, getAuditLogsController);

export default router;
