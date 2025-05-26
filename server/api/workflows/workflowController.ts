import type { Request, Response, NextFunction } from "express";
import { fromZodError } from "zod-validation-error";
import { insertWorkflowSchema, updateWorkflowSchema } from "../../database/validators/workflowValidators";
import * as workflowService from "./workflowService";

export async function getUserWorkflows(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Please login" });
    }

    const workflows = await workflowService.getUserWorkflows(userId);
    res.json({ workflows });
  } catch (error) {
    next(error);
  }
}

export async function getPublicWorkflows(req: Request, res: Response, next: NextFunction) {
  try {
    const workflows = await workflowService.getPublicWorkflows();
    res.json({ workflows });
  } catch (error) {
    next(error);
  }
}

export async function getWorkflowById(req: Request, res: Response, next: NextFunction) {
  try {
    const workflowId = req.params.id;
    const workflow = await workflowService.getWorkflowById(workflowId);

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // Check access permissions
    if (
      !workflow.isPublic &&
      (!req.isAuthenticated?.() || workflow.userId !== req.user?.id)
    ) {
      return res.status(403).json({ error: "Permission denied to view this workflow" });
    }

    res.json({ workflow });
  } catch (error) {
    next(error);
  }
}

export async function createWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Please login" });
    }

    const parseResult = insertWorkflowSchema.safeParse({ ...req.body, userId });
    if (!parseResult.success) {
      const validationError = fromZodError(parseResult.error);
      return res.status(400).json({ error: validationError.message });
    }

    const workflow = await workflowService.createWorkflow(parseResult.data);
    res.status(201).json({ workflow });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    const workflowId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Please login" });
    }

    // Check if exists and belongs to user
    const existingWorkflow = await workflowService.getWorkflowById(workflowId);
    if (!existingWorkflow || existingWorkflow.userId !== userId) {
      return res.status(404).json({ error: "Workflow not found or you don't have permission to update it" });
    }

    const parseResult = updateWorkflowSchema.safeParse(req.body);
    if (!parseResult.success) {
      const validationError = fromZodError(parseResult.error);
      return res.status(400).json({ error: validationError.message });
    }

    const updatedWorkflow = await workflowService.updateWorkflow(workflowId, userId, parseResult.data);

    if (!updatedWorkflow) {
      return res.status(500).json({ error: "Failed to update workflow" });
    }

    res.json({ workflow: updatedWorkflow });
  } catch (error) {
    next(error);
  }
}

export async function deleteWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    const workflowId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Please login" });
    }

    // Check if exists and belongs to user
    const existingWorkflow = await workflowService.getWorkflowById(workflowId);
    if (!existingWorkflow || existingWorkflow.userId !== userId) {
      return res.status(404).json({ error: "Workflow not found or you don't have permission to delete it" });
    }

    await workflowService.deleteWorkflow(workflowId, userId);
    res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    next(error);
  }
}
