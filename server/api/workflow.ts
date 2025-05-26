import { Router } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  createWorkflow,
  getUserWorkflows,
  getWorkflowById,
  saveWorkflow,
  deleteWorkflow,
  getWorkflowStructure
} from "../../src/lib/models/workflow";
import { executeWorkflow } from "../../src/lib/langchain/workflow-engine";
import { verifyConnection } from "../../src/lib/neo4j";
import { getProjectRuns, getRun } from "../../src/lib/langchain/langsmith";
import { executeAgentTask, AgentType } from "../../src/lib/agents";
import { executeAgentChain, AgentChainConfig } from "../../src/lib/agents/agentChain";

const router = Router();

// Validate Neo4j connection
router.get("/neo4j-status", async (req, res) => {
  try {
    const isConnected = await verifyConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error("Error checking Neo4j connection:", error);
    res.status(500).json({ 
      error: "Failed to verify Neo4j connection",
      details: (error as Error).message
    });
  }
});

// Create a new workflow
router.post("/", async (req, res) => {
  try {
    // Validate request body
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
    });

    const validatedData = schema.parse(req.body);
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = (req.user as any).id;
    
    // Create workflow in Neo4j
    const workflow = await createWorkflow(
      userId,
      validatedData.name,
      validatedData.description,
      validatedData.isPublic
    );
    
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
    
    // Get workflows from Neo4j
    const workflows = await getUserWorkflows(userId);
    
    res.json(workflows);
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
    
    // Get workflow from Neo4j
    const workflow = await getWorkflowById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId.toString() && !workflow.isPublic) {
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
    
    // Get workflow from Neo4j to check permissions
    const workflow = await getWorkflowById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId.toString() && !workflow.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get workflow structure
    const structure = await getWorkflowStructure(workflowId);
    
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
      connections: z.array(z.object({
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
    
    // Get workflow from Neo4j to check permissions
    const workflow = await getWorkflowById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Save workflow structure
    const updatedWorkflow = await saveWorkflow(
      workflowId,
      validatedData.nodes,
      validatedData.connections
    );
    
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
    
    // Get workflow from Neo4j to check permissions
    const workflow = await getWorkflowById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Delete workflow
    const success = await deleteWorkflow(workflowId);
    
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  } catch (error) {
    console.error("Error deleting workflow:", error);
    res.status(500).json({ 
      error: "Failed to delete workflow",
      details: (error as Error).message
    });
  }
});

// Execute a workflow
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
    
    // Get workflow from Neo4j to check permissions
    const workflow = await getWorkflowById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId.toString() && !workflow.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Execute the workflow using LangGraph
    const result = await executeWorkflow(workflowId, validatedData.input);
    
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
    
    // Get workflow from Neo4j to check permissions
    const workflow = await getWorkflowById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId.toString() && !workflow.isPublic) {
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
    
    // Get workflow from Neo4j to check permissions
    const workflow = await getWorkflowById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    
    // Check if user has access to this workflow
    const userId = (req.user as any).id;
    if (workflow.userId !== userId.toString() && !workflow.isPublic) {
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
      validatedData.apiKey,
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
      validatedData.apiKey,
      validatedData.input,
      validatedData.agents as AgentChainConfig[],
      validatedData.maxSteps
    );
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    console.error("Error executing agent chain:", error);
    res.status(500).json({ 
      error: "Failed to execute agent chain",
      details: (error as Error).message
    });
  }
});

export default router; 