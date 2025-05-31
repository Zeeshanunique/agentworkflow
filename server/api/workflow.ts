import { Router } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { db } from "../db";
import { workflows } from "../db/schema";
import { eq } from "drizzle-orm";
import { getProjectRuns, getRun } from "../lib/langsmith";
import { executeAgentTask, AgentType, executeAgentChain, AgentChainConfig } from "../lib/agents";

const router = Router();

// Health check endpoint
router.get("/health", async (_req, res) => {
  try {
    // Simple database connection check
    await db.select().from(workflows).limit(1);
    res.json({ status: "healthy", database: "connected" });
  } catch (error) {
    console.error("Error checking database connection:", error);
    res.status(500).json({ 
      error: "Database connection failed",
      details: (error as Error).message
    });
  }
});

// Create a new workflow
router.post("/", async (req, res) => {
  try {    // Validate request body
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
      nodes: z.array(z.any()).optional().default([]),
      edges: z.array(z.any()).optional().default([])
    });

    const validatedData = schema.parse(req.body);
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = (req.user as any).id;
      // Create workflow in PostgreSQL
    const [workflow] = await db.insert(workflows).values({
      name: validatedData.name,
      description: validatedData.description || "",
      userId: userId,
      nodes: validatedData.nodes,
      edges: validatedData.edges,
      isPublic: validatedData.isPublic || false
    }).returning();
    
    res.status(201).json(workflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    console.error("Error creating workflow:", error);
    res.status(500).json({ 
      error: "Failed to create workflow",
      details: (error as Error).message
    });
  }
});

// Get all workflows for the authenticated user
router.get("/", async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = (req.user as any).id;
    
    // Get workflows from PostgreSQL
    const userWorkflows = await db.select().from(workflows).where(eq(workflows.userId, userId));
    
    res.json(userWorkflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    res.status(500).json({ 
      error: "Failed to fetch workflows",
      details: (error as Error).message
    });
  }
});

// Get a specific workflow by ID
router.get("/:id", async (req, res) => {
  try {
    const workflowId = req.params.id;
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get workflow from PostgreSQL
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId && !workflow.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    res.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    res.status(500).json({ 
      error: "Failed to fetch workflow",
      details: (error as Error).message
    });
  }
});

// Get workflow structure (nodes and connections)
router.get("/:id/structure", async (req, res) => {
  try {
    const workflowId = req.params.id;
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get workflow from PostgreSQL to check permissions
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId && !workflow.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }
      // Return workflow structure
    const structure = {
      nodes: workflow.nodes,
      edges: workflow.edges
    };
    
    res.json(structure);
  } catch (error) {
    console.error("Error fetching workflow structure:", error);
    res.status(500).json({ 
      error: "Failed to fetch workflow structure",
      details: (error as Error).message
    });
  }
});

// Save workflow structure
router.put("/:id/structure", async (req, res) => {
  try {
    const workflowId = req.params.id;
      // Validate request body
    const schema = z.object({
      nodes: z.array(z.object({
        id: z.string(),
        type: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
        parameters: z.record(z.any()).optional(),
      })),
      edges: z.array(z.object({
        id: z.string(),
        fromNodeId: z.string(),
        toNodeId: z.string(),
        fromPortId: z.string(),
        toPortId: z.string(),
      })),
    });

    const validatedData = schema.parse(req.body);
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get workflow from PostgreSQL to check permissions
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
      // Update workflow structure
    const [updatedWorkflow] = await db.update(workflows)
      .set({
        nodes: validatedData.nodes,
        edges: validatedData.edges,
        updatedAt: new Date()
      })
      .where(eq(workflows.id, workflowId))
      .returning();
    
    res.json(updatedWorkflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    console.error("Error saving workflow structure:", error);
    res.status(500).json({ 
      error: "Failed to save workflow structure",
      details: (error as Error).message
    });
  }
});

// Delete a workflow
router.delete("/:id", async (req, res) => {
  try {
    const workflowId = req.params.id;
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get workflow from PostgreSQL to check permissions
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Delete workflow
    await db.delete(workflows).where(eq(workflows.id, workflowId));
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting workflow:", error);
    res.status(500).json({ 
      error: "Failed to delete workflow",
      details: (error as Error).message
    });
  }
});

// Execute a workflow (placeholder implementation)
router.post("/:id/execute", async (req, res) => {
  try {
    const workflowId = req.params.id;
    
    // Validate request body
    const schema = z.object({
      input: z.string(),
    });

    const validatedData = schema.parse(req.body);
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get workflow from PostgreSQL to check permissions
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId && !workflow.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // TODO: Implement workflow execution logic with PostgreSQL data
    // For now, return a placeholder response
    const result = {
      workflowId,
      input: validatedData.input,
      output: "Workflow execution completed (PostgreSQL-based)",
      status: "completed",
      timestamp: new Date().toISOString()
    };
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    console.error("Error executing workflow:", error);
    res.status(500).json({ 
      error: "Failed to execute workflow",
      details: (error as Error).message
    });
  }
});

// Get LangSmith runs for a workflow
router.get("/:id/runs", async (req, res) => {
  try {
    const workflowId = req.params.id;
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get workflow from PostgreSQL to check permissions
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId && !workflow.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get LangSmith runs for this workflow
    const projectName = `agentworkflow-${workflowId}`;
    const runs = await getProjectRuns(projectName);
    
    res.json(runs);
  } catch (error) {
    console.error("Error fetching workflow runs:", error);
    res.status(500).json({ 
      error: "Failed to fetch workflow runs",
      details: (error as Error).message
    });
  }
});

// Get a specific LangSmith run
router.get("/:id/runs/:runId", async (req, res) => {
  try {
    const workflowId = req.params.id;
    const runId = req.params.runId;
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get workflow from PostgreSQL to check permissions
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId && !workflow.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get the specific run
    const run = await getRun(runId);
    
    res.json(run);
  } catch (error) {
    console.error("Error fetching workflow run:", error);
    res.status(500).json({ 
      error: "Failed to fetch workflow run",
      details: (error as Error).message
    });
  }
});

// Execute a single agent task directly
router.post("/agent-task", async (req, res) => {
  try {
    // Validate request body
    const schema = z.object({
      agentType: z.enum(["marketing", "sales"]),
      task: z.string(),
      apiKey: z.string(),
    });

    const validatedData = schema.parse(req.body);
    
    // Map string agent type to enum
    const agentTypeEnum = validatedData.agentType === "marketing" 
      ? AgentType.MARKETING 
      : AgentType.SALES;
      // Execute the agent task
    const result = await executeAgentTask(
      agentTypeEnum,
      validatedData.task
    );
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    console.error("Error executing agent task:", error);
    res.status(500).json({ 
      error: "Failed to execute agent task",
      details: (error as Error).message
    });
  }
});

// Execute a chain of agents directly
router.post("/agent-chain", async (req, res) => {
  try {
    // Validate request body
    const schema = z.object({
      apiKey: z.string(),
      input: z.string(),
      agents: z.array(z.object({
        type: z.enum(["marketing", "sales"]),
        instructions: z.string().optional(),
        parameters: z.record(z.any()).optional(),
      })),
      maxSteps: z.number().optional(),
    });

    const validatedData = schema.parse(req.body);
      // Execute the agent chain
    const result = await executeAgentChain(
      validatedData.input,
      validatedData.agents as AgentChainConfig[],
      validatedData.maxSteps
    );
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }    console.error("Error executing agent chain:", error);
    res.status(500).json({ 
      error: "Failed to execute agent chain",
      details: (error as Error).message
    });
  }
});

const workflowRouter = router;
export default workflowRouter;