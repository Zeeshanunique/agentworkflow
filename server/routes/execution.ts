import express from "express";
import { workflowExecutionService } from "../services/workflowExecution";
import { schedulerService } from "../services/scheduler";
import { logger } from "../utils/logger";
import { z } from "zod";

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Execute a workflow by ID
router.post("/execute/:workflowId", requireAuth, async (req, res) => {
  try {
    const workflowId = req.params.workflowId;
    const { input = {}, triggeredBy = "manual" } = req.body;

    const execution = await workflowExecutionService.executeWorkflowById(
      workflowId, 
      input, 
      triggeredBy
    );

    res.json({
      success: true,
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        triggeredBy: execution.triggeredBy,
        error: execution.error
      }
    });

  } catch (error: any) {
    logger.error("Error executing workflow:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get execution status
router.get("/execution/:executionId", requireAuth, async (req, res) => {
  try {
    const executionId = req.params.executionId;
    const execution = workflowExecutionService.getExecution(executionId);

    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }

    res.json({
      id: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime,
      triggeredBy: execution.triggeredBy,
      input: execution.input,
      output: execution.output,
      error: execution.error
    });

  } catch (error: any) {
    logger.error("Error getting execution:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all executions for a workflow
router.get("/workflow/:workflowId/executions", requireAuth, async (req, res) => {
  try {
    const workflowId = req.params.workflowId;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const executions = workflowExecutionService.getWorkflowExecutions(workflowId)
      .slice(0, limit)
      .map(exec => ({
        id: exec.id,
        status: exec.status,
        startTime: exec.startTime,
        endTime: exec.endTime,
        triggeredBy: exec.triggeredBy,
        error: exec.error ? exec.error.substring(0, 200) : undefined // Truncate long errors
      }));

    res.json({
      workflowId,
      executions,
      count: executions.length
    });

  } catch (error: any) {
    logger.error("Error getting workflow executions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent executions across all workflows
router.get("/executions/recent", requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const executions = workflowExecutionService.getRecentExecutions(limit)
      .map(exec => ({
        id: exec.id,
        workflowId: exec.workflowId,
        status: exec.status,
        startTime: exec.startTime,
        endTime: exec.endTime,
        triggeredBy: exec.triggeredBy,
        error: exec.error ? exec.error.substring(0, 200) : undefined
      }));

    res.json({
      executions,
      count: executions.length
    });

  } catch (error: any) {
    logger.error("Error getting recent executions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel an execution
router.post("/execution/:executionId/cancel", requireAuth, async (req, res) => {
  try {
    const executionId = req.params.executionId;
    const cancelled = workflowExecutionService.cancelExecution(executionId);

    if (!cancelled) {
      return res.status(400).json({ 
        error: "Execution not found or cannot be cancelled" 
      });
    }

    res.json({ 
      success: true,
      message: "Execution cancelled" 
    });

  } catch (error: any) {
    logger.error("Error cancelling execution:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get execution statistics
router.get("/stats", requireAuth, async (_, res) => {
  try {
    const stats = workflowExecutionService.getStats();
    const scheduleStats = schedulerService.getActiveJobs();

    res.json({
      executions: stats,
      scheduler: {
        activeJobs: scheduleStats.length,
        jobs: scheduleStats
      }
    });

  } catch (error: any) {
    logger.error("Error getting stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Manage scheduler jobs
router.post("/scheduler/refresh", requireAuth, async (_, res) => {
  try {
    await schedulerService.refresh();
    
    res.json({ 
      success: true,
      message: "Scheduler refreshed" 
    });

  } catch (error: any) {
    logger.error("Error refreshing scheduler:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add a schedule job
router.post("/scheduler/job", requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      workflowId: z.string(),
      nodeId: z.string(),
      schedule: z.string()
    });

    const { workflowId, nodeId, schedule } = schema.parse(req.body);
    
    await schedulerService.addScheduleJob(workflowId, nodeId, schedule);
    
    res.json({ 
      success: true,
      message: "Schedule job added" 
    });

  } catch (error: any) {
    logger.error("Error adding schedule job:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Remove a schedule job
router.delete("/scheduler/job/:workflowId/:nodeId", requireAuth, async (req, res) => {
  try {
    const { workflowId, nodeId } = req.params;
    
    schedulerService.removeScheduleJob(workflowId, nodeId);
    
    res.json({ 
      success: true,
      message: "Schedule job removed" 
    });

  } catch (error: any) {
    logger.error("Error removing schedule job:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test workflow execution with sample data
router.post("/test-execution", requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
      input: z.any().optional().default({})
    });

    const { nodes, edges, input } = schema.parse(req.body);
    
    const execution = await workflowExecutionService.executeWorkflowDirect(
      nodes, 
      edges, 
      input,
      "api"
    );

    res.json({
      success: true,
      execution: {
        id: execution.id,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        output: execution.output,
        error: execution.error
      }
    });

  } catch (error: any) {
    logger.error("Error in test execution:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data" });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
