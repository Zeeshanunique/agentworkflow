import express from "express";
import { db } from "../db";
import { workflows } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Extend Express Request type
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
    }
  }
}

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Schema for workflow validation
const workflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  nodes: z.array(z.any()).or(z.object({})),
  edges: z.array(z.any()).or(z.object({})),
  isPublic: z.boolean().optional()
});

// Get all workflows for the current user
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    const userWorkflows = await db.query.workflows.findMany({
      where: eq(workflows.userId, userId),
      orderBy: (workflows, { desc }) => [desc(workflows.updatedAt)]
    });
    
    res.json({ workflows: userWorkflows });
  } catch (error) {
    next(error);
  }
});

// Get public workflows
router.get("/public", async (_req, res, next) => {
  try {
    const publicWorkflows = await db.query.workflows.findMany({
      where: eq(workflows.isPublic, true),
      orderBy: (workflows, { desc }) => [desc(workflows.updatedAt)]
    });
    
    res.json({ workflows: publicWorkflows });
  } catch (error) {
    next(error);
  }
});

// Get a specific workflow
router.get("/:id", async (req, res, next) => {
  try {
    const workflowId = req.params.id;
    
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId)
    });
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if workflow is public or belongs to the current user
    if (!workflow.isPublic && (!req.isAuthenticated() || workflow.userId !== req.user?.id)) {
      return res.status(403).json({ error: "You don't have permission to view this workflow" });
    }
    
    res.json({ workflow });
  } catch (error) {
    next(error);
  }
});

// Create a new workflow
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    // Validate request body
    const result = workflowSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ error: validationError.message });
    }
    
    const { name, description, nodes, edges, isPublic = false } = result.data;
    
    // Create the workflow
    const [newWorkflow] = await db.insert(workflows).values({
      name,
      description,
      userId,
      nodes,
      edges,
      isPublic
    }).returning();
    
    res.status(201).json({ workflow: newWorkflow });
  } catch (error) {
    next(error);
  }
});

// Update a workflow
router.put("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const workflowId = req.params.id;
    const userId = req.user!.id;
    
    // Check if workflow exists and belongs to the user
    const existingWorkflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.id, workflowId),
        eq(workflows.userId, userId)
      )
    });
    
    if (!existingWorkflow) {
      return res.status(404).json({ error: "Workflow not found or you don't have permission to update it" });
    }
    
    // Validate request body
    const result = workflowSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ error: validationError.message });
    }
    
    const { name, description, nodes, edges, isPublic = false } = result.data;
    
    // Update the workflow
    const [updatedWorkflow] = await db.update(workflows)
      .set({
        name,
        description,
        nodes,
        edges,
        isPublic,
        updatedAt: new Date()
      })
      .where(and(
        eq(workflows.id, workflowId),
        eq(workflows.userId, userId)
      ))
      .returning();
    
    res.json({ workflow: updatedWorkflow });
  } catch (error) {
    next(error);
  }
});

// Delete a workflow
router.delete("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const workflowId = req.params.id;
    const userId = req.user!.id;
    
    // Check if workflow exists and belongs to the user
    const existingWorkflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.id, workflowId),
        eq(workflows.userId, userId)
      )
    });
    
    if (!existingWorkflow) {
      return res.status(404).json({ error: "Workflow not found or you don't have permission to delete it" });
    }
    
    // Delete the workflow
    await db.delete(workflows).where(and(
      eq(workflows.id, workflowId),
      eq(workflows.userId, userId)
    ));
    
    res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
