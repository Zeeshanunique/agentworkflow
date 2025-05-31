import express from "express";
import { db } from "../db";
import { workflows } from "../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger";
import { executeWorkflow } from "../../src/utils/workflowExecutor";

const router = express.Router();

// Generic webhook endpoint that can handle any path
router.all("/webhook/*", async (req, res) => {
  try {
    const webhookPath = (req.params as any)[0] as string; // Get the path after /webhook/
    const method = req.method;
    const headers = req.headers;
    const body = req.body;
    const query = req.query;

    logger.info(`Webhook triggered: ${method} /webhook/${webhookPath}`, {
      headers: Object.keys(headers),
      bodyKeys: Object.keys(body || {}),
      queryKeys: Object.keys(query || {})
    });

    // Find workflows that have webhook triggers matching this path
    const allWorkflows = await db.select().from(workflows);
    
    const triggeredWorkflows = allWorkflows.filter(workflow => {
      const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
      return nodes.some((node: any) => 
        node.type === "webhook_trigger" && 
        node.parameters?.path === `/${webhookPath}` &&
        (!node.parameters?.method || node.parameters.method.toLowerCase() === method.toLowerCase())
      );
    });

    if (triggeredWorkflows.length === 0) {
      return res.status(404).json({ 
        error: "No webhook triggers found for this path",
        path: `/${webhookPath}`,
        method: method
      });
    }

    const results = [];

    // Execute each triggered workflow
    for (const workflow of triggeredWorkflows) {
      try {
        logger.info(`Executing workflow ${workflow.id} (${workflow.name}) triggered by webhook`);

        const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
        const edges = Array.isArray(workflow.edges) ? workflow.edges : [];

        // Find the webhook trigger node
        const webhookNode = nodes.find((node: any) => 
          node.type === "webhook_trigger" && 
          node.parameters?.path === `/${webhookPath}`
        );        if (!webhookNode) continue;

        // Execute the workflow with webhook data as input
        const result = await executeWorkflow(nodes, edges);
        
        results.push({
          workflowId: workflow.id,
          workflowName: workflow.name,
          success: result.success,
          data: result.results,
          error: result.error
        });

        logger.info(`Workflow ${workflow.id} execution completed`, {
          success: result.success,
          error: result.error
        });

      } catch (error: any) {
        logger.error(`Error executing workflow ${workflow.id}:`, error);
        results.push({
          workflowId: workflow.id,
          workflowName: workflow.name,
          success: false,
          error: `Execution error: ${error.message}`
        });
      }
    }

    // Return results
    res.json({
      message: "Webhook processed",
      path: `/${webhookPath}`,
      method: method,
      triggeredWorkflows: results.length,
      results: results
    });

  } catch (error: any) {
    logger.error("Error processing webhook:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message
    });
  }
});

// Webhook endpoint for testing
router.post("/webhook/test", async (req, res) => {
  try {
    const { workflowId } = req.body;

    if (!workflowId) {
      return res.status(400).json({ error: "workflowId is required" });
    }

    // Get the workflow
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
    const edges = Array.isArray(workflow.edges) ? workflow.edges : [];

    // Execute the workflow with test data
    const result = await executeWorkflow(nodes, edges);

    logger.info(`Test webhook execution for workflow ${workflowId}`, {
      success: result.success,
      error: result.error
    });

    res.json({
      message: "Test webhook executed",
      workflowId,
      success: result.success,
      results: result.results,
      error: result.error
    });

  } catch (error: any) {
    logger.error("Error executing test webhook:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message
    });
  }
});

// List all registered webhooks
router.get("/webhooks", async (req, res) => {
  try {
    const allWorkflows = await db.select().from(workflows);
    
    const webhooks = [];
    
    for (const workflow of allWorkflows) {
      const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
      const webhookNodes = nodes.filter((node: any) => node.type === "webhook_trigger");
      
      for (const node of webhookNodes) {
        webhooks.push({
          workflowId: workflow.id,
          workflowName: workflow.name,
          nodeId: node.id,
          path: node.parameters?.path || "/webhook",
          method: node.parameters?.method || "POST",
          authentication: node.parameters?.authentication || "none",
          isActive: true,
          url: `${req.protocol}://${req.get('host')}/webhook${node.parameters?.path || ""}`
        });
      }
    }

    res.json({
      webhooks,
      count: webhooks.length
    });

  } catch (error: any) {
    logger.error("Error listing webhooks:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message
    });
  }
});

export default router;
