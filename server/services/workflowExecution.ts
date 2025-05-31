import { logger } from "../utils/logger";
import { executeWorkflow } from "../../src/utils/workflowExecutor";
import { db } from "../db";
import { workflows } from "../db/schema";
import { eq } from "drizzle-orm";

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  input: any;
  output?: any;
  error?: string;
  triggeredBy: "manual" | "webhook" | "schedule" | "api";
}

class WorkflowExecutionService {
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    logger.info("Workflow execution service initialized");
  }

  // Execute a workflow by ID
  async executeWorkflowById(
    workflowId: string, 
    input: any = {}, 
    triggeredBy: WorkflowExecution["triggeredBy"] = "manual"
  ): Promise<WorkflowExecution> {
    
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: "running",
      startTime: new Date(),
      input,
      triggeredBy
    };

    this.executions.set(executionId, execution);
    
    try {
      logger.info(`Starting workflow execution ${executionId} for workflow ${workflowId}`);

      // Get the workflow from database
      const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
      
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
      const edges = Array.isArray(workflow.edges) ? workflow.edges : [];

      if (nodes.length === 0) {
        throw new Error("Workflow has no nodes to execute");
      }

      // Execute the workflow
      const result = await executeWorkflow(nodes, edges);

      // Update execution record
      execution.status = result.success ? "completed" : "failed";
      execution.endTime = new Date();
      execution.output = result.results;
      execution.error = result.error;

      this.executions.set(executionId, execution);

      logger.info(`Workflow execution ${executionId} ${execution.status}`, {
        duration: execution.endTime.getTime() - execution.startTime.getTime(),
        success: result.success,
        error: result.error
      });

      return execution;

    } catch (error: any) {
      logger.error(`Workflow execution ${executionId} failed:`, error);
      
      execution.status = "failed";
      execution.endTime = new Date();
      execution.error = error.message;
      
      this.executions.set(executionId, execution);
      
      return execution;
    }
  }

  // Execute workflow directly with nodes and edges
  async executeWorkflowDirect(
    nodes: any[], 
    edges: any[], 
    input: any = {},
    triggeredBy: WorkflowExecution["triggeredBy"] = "api"
  ): Promise<WorkflowExecution> {
    
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: "direct",
      status: "running",
      startTime: new Date(),
      input,
      triggeredBy
    };

    this.executions.set(executionId, execution);
    
    try {
      logger.info(`Starting direct workflow execution ${executionId}`);

      if (nodes.length === 0) {
        throw new Error("Workflow has no nodes to execute");
      }

      // Execute the workflow
      const result = await executeWorkflow(nodes, edges);

      // Update execution record
      execution.status = result.success ? "completed" : "failed";
      execution.endTime = new Date();
      execution.output = result.results;
      execution.error = result.error;

      this.executions.set(executionId, execution);

      logger.info(`Direct workflow execution ${executionId} ${execution.status}`, {
        duration: execution.endTime.getTime() - execution.startTime.getTime(),
        success: result.success,
        nodeCount: nodes.length,
        error: result.error
      });

      return execution;

    } catch (error: any) {
      logger.error(`Direct workflow execution ${executionId} failed:`, error);
      
      execution.status = "failed";
      execution.endTime = new Date();
      execution.error = error.message;
      
      this.executions.set(executionId, execution);
      
      return execution;
    }
  }

  // Get execution by ID
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  // Get all executions for a workflow
  getWorkflowExecutions(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // Get recent executions
  getRecentExecutions(limit: number = 50): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  // Cancel an execution (if possible)
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    
    if (!execution || execution.status !== "running") {
      return false;
    }

    execution.status = "cancelled";
    execution.endTime = new Date();
    
    this.executions.set(executionId, execution);
    
    logger.info(`Workflow execution ${executionId} cancelled`);
    
    return true;
  }

  // Clean up old executions (keep last 1000)
  cleanup(maxExecutions: number = 1000) {
    const executions = Array.from(this.executions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    if (executions.length > maxExecutions) {
      const toRemove = executions.slice(maxExecutions);
      
      for (const execution of toRemove) {
        this.executions.delete(execution.id);
      }

      logger.info(`Cleaned up ${toRemove.length} old workflow executions`);
    }
  }

  // Get execution statistics
  getStats() {
    const executions = Array.from(this.executions.values());
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentExecutions = executions.filter(exec => exec.startTime > oneHourAgo);
    const dailyExecutions = executions.filter(exec => exec.startTime > oneDayAgo);

    return {
      total: executions.length,
      lastHour: recentExecutions.length,
      lastDay: dailyExecutions.length,
      running: executions.filter(exec => exec.status === "running").length,
      completed: executions.filter(exec => exec.status === "completed").length,
      failed: executions.filter(exec => exec.status === "failed").length,
      cancelled: executions.filter(exec => exec.status === "cancelled").length,
      averageDuration: this.calculateAverageDuration(executions.filter(exec => exec.endTime))
    };
  }

  private calculateAverageDuration(completedExecutions: WorkflowExecution[]): number {
    if (completedExecutions.length === 0) return 0;
    
    const totalDuration = completedExecutions.reduce((sum, exec) => {
      if (exec.endTime) {
        return sum + (exec.endTime.getTime() - exec.startTime.getTime());
      }
      return sum;
    }, 0);

    return Math.round(totalDuration / completedExecutions.length);
  }
}

// Create singleton instance
export const workflowExecutionService = new WorkflowExecutionService();

// Set up cleanup interval (every hour)
setInterval(() => {
  workflowExecutionService.cleanup();
}, 60 * 60 * 1000);

// Export the class for testing
export { WorkflowExecutionService };
