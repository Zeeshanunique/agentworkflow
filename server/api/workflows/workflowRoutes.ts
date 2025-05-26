import express from "express";
import * as workflowController from "./workflowController"

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

router.get("/", isAuthenticated, workflowController.getUserWorkflows);
router.get("/public", workflowController.getPublicWorkflows);
router.get("/:id", workflowController.getWorkflowById);
router.post("/", isAuthenticated, workflowController.createWorkflow);
router.put("/:id", isAuthenticated, workflowController.updateWorkflow);
router.delete("/:id", isAuthenticated, workflowController.deleteWorkflow);

export default router;
