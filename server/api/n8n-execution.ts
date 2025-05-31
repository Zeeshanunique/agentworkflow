import { Router } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { db } from "../db";
import { workflows, workflowExecutions } from "../db/schema";
import { eq } from "drizzle-orm";
import { N8nWorkflowExecutor } from "../../src/utils/n8nWorkflowExecutor";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Execute workflow with n8n executor
router.post("/workflow/:id/execute", async (req, res) => {
  try {
    const workflowId = req.params.id;
    const { inputData = {} } = req.body;

    // Validate request body
    const schema = z.object({
      trigger: z.enum(["manual", "webhook", "schedule"]).optional().default("manual"),
      inputData: z.record(z.any()).optional().default({})
    });

    const validatedData = schema.parse(req.body);

    // Get workflow from database
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // Check if user is authorized to execute this workflow
    if (!req.user && !workflow.isPublic) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user && workflow.userId !== (req.user as any).id && !workflow.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Generate execution ID
    const executionId = uuidv4();

    // Create n8n executor
    const n8nExecutor = new N8nWorkflowExecutor({
      executionId,
      userId: req.user ? (req.user as any).id : undefined,
      mode: validatedData.trigger,
      startTime: new Date(),
      variables: validatedData.inputData,
      credentials: {}
    });

    // Load workflow
    const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
    const connections = Array.isArray(workflow.edges) ? workflow.edges : [];

    if (nodes.length === 0) {
      return res.status(400).json({ error: "Workflow has no nodes to execute" });
    }

    n8nExecutor.loadWorkflow(nodes, connections);

    // Start execution
    logger.info(`Starting n8n workflow execution ${executionId} for workflow ${workflowId}`);
    
    // Save execution record to database
    await db.insert(workflowExecutions).values({
      id: executionId,
      workflowId,
      userId: req.user ? (req.user as any).id : null,
      status: "running",
      startTime: new Date(),
      mode: validatedData.trigger,
      inputData: validatedData.inputData
    }).returning();

    // Execute workflow
    const result = await n8nExecutor.executeWorkflow();

    // Update execution with results
    await db.update(workflowExecutions)
      .set({
        status: result.success ? "completed" : "failed",
        endTime: new Date(),
        outputData: result.data,
        error: result.error,
        executionTime: result.executionTime
      })
      .where(eq(workflowExecutions.id, executionId));

    logger.info(`N8n workflow execution ${executionId} ${result.success ? 'completed' : 'failed'}`, {
      workflowId,
      executionTime: result.executionTime,
      error: result.error
    });

    res.json({
      success: result.success,
      executionId,
      data: result.data,
      error: result.error,
      executionTime: result.executionTime,
      nodeResults: result.nodeResults ? Object.fromEntries(result.nodeResults) : undefined
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    logger.error("Error executing n8n workflow:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to execute workflow",
      details: (error as Error).message
    });
  }
});

// Get execution status
router.get("/execution/:id/status", async (req, res) => {
  try {
    const executionId = req.params.id;

    const [execution] = await db.select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, executionId));

    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }

    // Check authorization
    if (!req.user && execution.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user && execution.userId && execution.userId !== (req.user as any).id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      id: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime,
      mode: execution.mode,
      inputData: execution.inputData,
      outputData: execution.outputData,
      error: execution.error,
      executionTime: execution.executionTime
    });

  } catch (error) {
    logger.error("Error getting execution status:", error);
    res.status(500).json({ 
      error: "Failed to get execution status",
      details: (error as Error).message
    });
  }
});

// Get workflow executions
router.get("/workflow/:id/executions", async (req, res) => {
  try {
    const workflowId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get workflow to check permissions
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // Check authorization
    if (!req.user && !workflow.isPublic) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user && workflow.userId !== (req.user as any).id && !workflow.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get executions
    const executions = await db.select({
      id: workflowExecutions.id,
      status: workflowExecutions.status,
      startTime: workflowExecutions.startTime,
      endTime: workflowExecutions.endTime,
      mode: workflowExecutions.mode,
      error: workflowExecutions.error,
      executionTime: workflowExecutions.executionTime
    })
    .from(workflowExecutions)
    .where(eq(workflowExecutions.workflowId, workflowId))
    .limit(limit)
    .offset(offset)
    .orderBy(workflowExecutions.startTime);

    res.json({
      workflowId,
      executions,
      count: executions.length
    });

  } catch (error) {
    logger.error("Error getting workflow executions:", error);
    res.status(500).json({ 
      error: "Failed to get workflow executions",
      details: (error as Error).message
    });
  }
});

// Test node execution (for debugging)
router.post("/test-node", async (req, res) => {
  try {
    const { nodeType } = req.body;

    // Validate request
    const schema = z.object({
      nodeType: z.string(),
      parameters: z.record(z.any()).optional().default({}),
      inputData: z.array(z.any()).optional().default([])
    });

    const validatedData = schema.parse(req.body);

    // Create test execution context
    const executionId = uuidv4();
    const n8nExecutor = new N8nWorkflowExecutor({
      executionId,
      mode: "manual",
      startTime: new Date(),
      variables: {},
      credentials: {}
    });

    // Create a simple test workflow with one node
    const testNode = {
      id: "test-node",
      name: "Test Node",
      type: validatedData.nodeType,
      position: { x: 0, y: 0 },
      parameters: validatedData.parameters,
      inputs: [],
      outputs: []
    };

    n8nExecutor.loadWorkflow([testNode], []);

    // Execute the single node
    const result = await n8nExecutor.executeWorkflow();

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
      executionTime: result.executionTime
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    logger.error("Error testing node:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to test node",
      details: (error as Error).message
    });
  }
});

export default router;
