import * as cron from "node-cron";
import { db } from "../db";
import { workflows } from "../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger";
import { N8nWorkflowExecutor } from "../../src/utils/n8nWorkflowExecutor";
import { registerWorkflowTriggers, unregisterWorkflowTriggers } from "../../src/lib/triggerWorkflowIntegration";

interface ScheduleJob {
  workflowId: string;
  nodeId: string;
  schedule: string;
  task: cron.ScheduledTask;
}

class SchedulerService {
  private jobs: Map<string, ScheduleJob> = new Map();

  constructor() {
    logger.info("Scheduler service initialized");
  }

  // Start the scheduler and load all scheduled workflows
  async start() {
    try {
      await this.loadScheduledWorkflows();
      logger.info("Scheduler service started");
    } catch (error) {
      logger.error("Error starting scheduler service:", error);
    }
  }
  // Load all workflows with schedule triggers
  async loadScheduledWorkflows() {
    try {
      const allWorkflows = await db.select().from(workflows);
      
      for (const workflow of allWorkflows) {
        const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
        
        // Handle legacy schedule triggers
        const scheduleNodes = nodes.filter((node: any) => node.type === "schedule_trigger");
        for (const node of scheduleNodes) {
          await this.addScheduleJob(workflow.id, node.id, node.parameters?.rule || "0 9 * * 1-5");
        }
        
        // Handle n8n trigger nodes
        const n8nTriggerNodes = nodes.filter((node: any) => {
          // Check if this is an n8n node with trigger property
          return node.type?.includes('n8n-nodes-base') && (
            node.type?.includes('Trigger') || 
            node.properties?.trigger === true
          );
        });
        
        if (n8nTriggerNodes.length > 0) {
          logger.info(`Found ${n8nTriggerNodes.length} n8n trigger nodes for workflow ${workflow.id}`);
          
          // Convert to trigger registration format
          const triggerConfigs = n8nTriggerNodes.map(node => ({
            nodeId: node.id,
            type: node.type,
            parameters: node.parameters || {}
          }));
          
          // Register with trigger discovery service
          await registerWorkflowTriggers(workflow.id, triggerConfigs);
        }
      }

      logger.info(`Loaded ${this.jobs.size} legacy scheduled workflows and registered n8n triggers`);
    } catch (error) {
      logger.error("Error loading scheduled workflows:", error);
    }
  }

  // Add a new schedule job
  async addScheduleJob(workflowId: string, nodeId: string, schedule: string) {
    try {
      const jobKey = `${workflowId}-${nodeId}`;
      
      // Remove existing job if it exists
      this.removeScheduleJob(workflowId, nodeId);

      // Validate cron expression
      if (!cron.validate(schedule)) {
        logger.error(`Invalid cron schedule: ${schedule} for workflow ${workflowId}`);
        return;
      }      // Create new cron job
      const task = cron.schedule(schedule, async () => {
        await this.executeScheduledWorkflow(workflowId, nodeId);
      });

      // Store the job
      this.jobs.set(jobKey, {
        workflowId,
        nodeId,
        schedule,
        task
      });

      // Start the job
      task.start();

      logger.info(`Added schedule job: ${schedule} for workflow ${workflowId}, node ${nodeId}`);
    } catch (error) {
      logger.error(`Error adding schedule job for workflow ${workflowId}:`, error);
    }
  }

  // Remove a schedule job
  removeScheduleJob(workflowId: string, nodeId: string) {
    const jobKey = `${workflowId}-${nodeId}`;
    const job = this.jobs.get(jobKey);
    
    if (job) {
      job.task.stop();
      job.task.destroy();
      this.jobs.delete(jobKey);
      logger.info(`Removed schedule job for workflow ${workflowId}, node ${nodeId}`);
    }
  }

  // Remove all jobs for a workflow
  removeWorkflowJobs(workflowId: string) {
    const jobsToRemove = Array.from(this.jobs.keys()).filter(key => key.startsWith(workflowId));
    
    for (const jobKey of jobsToRemove) {
      const job = this.jobs.get(jobKey);
      if (job) {
        job.task.stop();
        job.task.destroy();
        this.jobs.delete(jobKey);
      }
    }

    logger.info(`Removed ${jobsToRemove.length} schedule jobs for workflow ${workflowId}`);
  }

  // Execute a scheduled workflow
  async executeScheduledWorkflow(workflowId: string, nodeId: string) {
    try {
      logger.info(`Executing scheduled workflow ${workflowId}, triggered by node ${nodeId}`);      // Get the workflow
      const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
      
      if (!workflow) {
        logger.error(`Scheduled workflow ${workflowId} not found`);
        return;
      }      const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
      const edges = Array.isArray(workflow.edges) ? workflow.edges : [];

      // Execute the workflow using N8n executor
      const executionContext = {
        executionId: `scheduled-${workflowId}-${Date.now()}`,
        mode: 'schedule' as const,
        startTime: new Date(),
        variables: {},
        credentials: {}
      };
      
      const executor = new N8nWorkflowExecutor(executionContext);
      executor.loadWorkflow(nodes, edges);
      const result = await executor.executeWorkflow();

      if (result.success) {
        logger.info(`Scheduled workflow ${workflowId} executed successfully`);
      } else {
        logger.error(`Scheduled workflow ${workflowId} execution failed:`, result.error);
      }

    } catch (error) {
      logger.error(`Error executing scheduled workflow ${workflowId}:`, error);
    }
  }

  // Update schedule for a workflow
  async updateSchedule(workflowId: string, nodeId: string, newSchedule: string) {
    await this.addScheduleJob(workflowId, nodeId, newSchedule);
  }

  // Get all active jobs
  getActiveJobs() {
    const jobs = Array.from(this.jobs.values()).map(job => ({
      workflowId: job.workflowId,
      nodeId: job.nodeId,
      schedule: job.schedule,
      isRunning: job.task.getStatus() === "scheduled"
    }));

    return jobs;
  }
  // Stop all jobs
  stop() {
    // Stop legacy cron jobs
    for (const job of this.jobs.values()) {
      job.task.stop();
      job.task.destroy();
    }
    
    this.jobs.clear();
    
    // Clean up all n8n trigger registrations
    try {
      unregisterWorkflowTriggers('*'); // Special value to unregister all
    } catch (error) {
      logger.error("Error cleaning up n8n triggers:", error);
    }
    
    logger.info("Scheduler service stopped and all triggers unregistered");
  }

  // Refresh schedules (reload from database)
  async refresh() {
    this.stop();
    await this.loadScheduledWorkflows();
    logger.info("Scheduler refreshed");
  }
}

// Create singleton instance
export const schedulerService = new SchedulerService();

// Export the class for testing
export { SchedulerService };
