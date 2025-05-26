import express from "express";
import authRoutes from "./auth/authRoutes";
import workflowRoutes from "./workflows/workflowRoutes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/workflows", workflowRoutes);

export default router;
