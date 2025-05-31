import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { webhookEndpoints, workflowSchedules, workflows } from '../db/schema';
import { logger } from '../utils/logger';
import { executeWorkflow } from '../lib/WorkflowExecutor';
import { parse as parseCron } from 'cron-parser';
import { EventEmitter } from 'events';

// Trigger events
export const triggerEvents = new EventEmitter();

// Scheduled jobs tracking
interface ScheduledJob {
  workflowId: string;
  cronExpression: string;
  timezone: string;
  nextRunTime: Date;
  timer: NodeJS.Timeout;
}

/**
 * TriggerService
 * Manages workflow triggers (webhooks, schedules, manual)
 * Following n8n's approach of persistent trigger registration
 */
export class TriggerService {
  private activeWebhooks: Map<string, string> = new Map(); // path -> workflowId
  private scheduledJobs: Map<string, ScheduledJob> = new Map(); // workflowId -> job
  private initialized = false;

  /**
   * Initialize trigger service
   * Loads all active webhooks and schedules
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Load all active webhooks
      await this.loadActiveWebhooks();
      
      // Load all active schedules
      await this.loadActiveSchedules();
      
      this.initialized = true;
      logger.info('Trigger service initialized');
      
      // Register event listeners
      this.registerEventListeners();
    } catch (error) {
      logger.error('Error initializing trigger service:', error);
      throw new Error(`Failed to initialize trigger service: ${error.message}`);
    }
  }

  /**
   * Register event listeners
   */
  private registerEventListeners(): void {
    // Listen for workflow updates to refresh triggers
    triggerEvents.on('workflow.updated', async (data: { workflowId: string }) => {
      await this.refreshWorkflowTriggers(data.workflowId);
    });
    
    // Listen for workflow deletion to remove triggers
    triggerEvents.on('workflow.deleted', async (data: { workflowId: string }) => {
      await this.deactivateWorkflowTriggers(data.workflowId);
    });
  }

  /**
   * Load all active webhooks from database
   */
  private async loadActiveWebhooks(): Promise<void> {
    try {
      const activeWebhooks = await db.query.webhookEndpoints.findMany({
        where: eq(webhookEndpoints.isActive, true)
      });
      
      for (const webhook of activeWebhooks) {
        this.activeWebhooks.set(webhook.path, webhook.workflowId);
        logger.info(`Registered webhook: ${webhook.method} ${webhook.path} for workflow ${webhook.workflowId}`);
      }
      
      logger.info(`Loaded ${activeWebhooks.length} active webhooks`);
    } catch (error) {
      logger.error('Error loading active webhooks:', error);
    }
  }

  /**
   * Load all active schedules from database
   */
  private async loadActiveSchedules(): Promise<void> {
    try {
      const activeSchedules = await db.query.workflowSchedules.findMany({
        where: eq(workflowSchedules.isActive, true)
      });
      
      for (const schedule of activeSchedules) {
        await this.activateSchedule(
          schedule.id,
          schedule.workflowId, 
          schedule.cronExpression, 
          schedule.timezone
        );
      }
      
      logger.info(`Loaded ${activeSchedules.length} active schedules`);
    } catch (error) {
      logger.error('Error loading active schedules:', error);
    }
  }

  /**
   * Register a webhook trigger
   */
  async registerWebhook(
    workflowId: string,
    path: string,
    method = 'POST',
    authType = 'none',
    authConfig = {}
  ): Promise<string> {
    try {
      // Check if webhook path already exists
      const existingWebhook = await db.query.webhookEndpoints.findFirst({
        where: eq(webhookEndpoints.path, path)
      });
      
      if (existingWebhook && existingWebhook.workflowId !== workflowId) {
        throw new Error(`Webhook path ${path} is already in use`);
      }
      
      let webhookId: string;
      
      if (existingWebhook) {
        // Update existing webhook
        await db.update(webhookEndpoints)
          .set({
            method,
            authType,
            authConfig: authConfig as any,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(webhookEndpoints.id, existingWebhook.id));
        
        webhookId = existingWebhook.id;
      } else {
        // Create new webhook
        const result = await db.insert(webhookEndpoints)
          .values({
            workflowId,
            path,
            method,
            authType,
            authConfig: authConfig as any
          })
          .returning({ id: webhookEndpoints.id });
        
        webhookId = result[0].id;
      }
      
      // Register in memory
      this.activeWebhooks.set(path, workflowId);
      
      logger.info(`Registered webhook: ${method} ${path} for workflow ${workflowId}`);
      return webhookId;
    } catch (error) {
      logger.error('Error registering webhook:', error);
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
  }

  /**
   * Unregister a webhook trigger
   */
  async unregisterWebhook(path: string): Promise<boolean> {
    try {
      // Find webhook in database
      const webhook = await db.query.webhookEndpoints.findFirst({
        where: eq(webhookEndpoints.path, path)
      });
      
      if (!webhook) {
        return false;
      }
      
      // Mark as inactive in database
      await db.update(webhookEndpoints)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(webhookEndpoints.id, webhook.id));
      
      // Remove from active webhooks
      this.activeWebhooks.delete(path);
      
      logger.info(`Unregistered webhook: ${webhook.method} ${path}`);
      return true;
    } catch (error) {
      logger.error('Error unregistering webhook:', error);
      throw new Error(`Failed to unregister webhook: ${error.message}`);
    }
  }

  /**
   * Handle webhook execution
   */
  async executeWebhook(
    path: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    query: Record<string, string>
  ): Promise<{
    success: boolean;
    workflowId?: string;
    executionId?: string;
    error?: string;
  }> {
    try {
      // Check if webhook is registered
      const workflowId = this.activeWebhooks.get(path);
      if (!workflowId) {
        return {
          success: false,
          error: `No active webhook registered for path: ${path}`
        };
      }
      
      // Prepare input data
      const inputData = {
        body,
        headers,
        query,
        method
      };
      
      // Execute workflow
      const result = await executeWorkflow(
        workflowId,
        inputData,
        undefined, // No user context for webhooks
        'webhook'
      );
      
      return {
        success: result.success,
        workflowId,
        executionId: result.result?.id,
        error: result.error || undefined
      };
    } catch (error) {
      logger.error(`Error executing webhook ${path}:`, error);
      return {
        success: false,
        error: `Webhook execution failed: ${error.message}`
      };
    }
  }

  /**
   * Register a schedule trigger
   */
  async registerSchedule(
    workflowId: string,
    cronExpression: string,
    timezone = 'UTC'
  ): Promise<string> {
    try {
      // Validate cron expression
      try {
        parseCron(cronExpression, { tz: timezone });
      } catch (error) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }
      
      // Check if schedule already exists for this workflow
      const existingSchedule = await db.query.workflowSchedules.findFirst({
        where: eq(workflowSchedules.workflowId, workflowId)
      });
      
      let scheduleId: string;
      
      if (existingSchedule) {
        // Update existing schedule
        await db.update(workflowSchedules)
          .set({
            cronExpression,
            timezone,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(workflowSchedules.id, existingSchedule.id));
        
        scheduleId = existingSchedule.id;
        
        // Deactivate any existing schedule for this workflow
        this.deactivateSchedule(workflowId);
      } else {
        // Create new schedule
        const result = await db.insert(workflowSchedules)
          .values({
            workflowId,
            cronExpression,
            timezone
          })
          .returning({ id: workflowSchedules.id });
        
        scheduleId = result[0].id;
      }
      
      // Activate schedule
      await this.activateSchedule(scheduleId, workflowId, cronExpression, timezone);
      
      return scheduleId;
    } catch (error) {
      logger.error('Error registering schedule:', error);
      throw new Error(`Failed to register schedule: ${error.message}`);
    }
  }

  /**
   * Unregister a schedule trigger
   */
  async unregisterSchedule(workflowId: string): Promise<boolean> {
    try {
      // Find schedule in database
      const schedule = await db.query.workflowSchedules.findFirst({
        where: eq(workflowSchedules.workflowId, workflowId)
      });
      
      if (!schedule) {
        return false;
      }
      
      // Mark as inactive in database
      await db.update(workflowSchedules)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(workflowSchedules.id, schedule.id));
      
      // Deactivate schedule
      this.deactivateSchedule(workflowId);
      
      return true;
    } catch (error) {
      logger.error('Error unregistering schedule:', error);
      throw new Error(`Failed to unregister schedule: ${error.message}`);
    }
  }

  /**
   * Activate a schedule in memory
   */
  private async activateSchedule(
    scheduleId: string,
    workflowId: string,
    cronExpression: string,
    timezone: string
  ): Promise<void> {
    try {
      // Deactivate any existing schedule first
      this.deactivateSchedule(workflowId);
      
      // Calculate next run time
      const interval = parseCron(cronExpression, { tz: timezone });
      const nextRunTime = interval.next().toDate();
      
      // Calculate ms until next run
      const msUntilNextRun = nextRunTime.getTime() - Date.now();
      
      // Create timer for next run
      const timer = setTimeout(() => {
        this.executeScheduledWorkflow(workflowId, scheduleId);
      }, msUntilNextRun);
      
      // Store scheduled job
      this.scheduledJobs.set(workflowId, {
        workflowId,
        cronExpression,
        timezone,
        nextRunTime,
        timer
      });
      
      logger.info(`Scheduled workflow ${workflowId} to run at ${nextRunTime.toISOString()} (${cronExpression})`);
    } catch (error) {
      logger.error(`Error activating schedule for workflow ${workflowId}:`, error);
    }
  }

  /**
   * Deactivate a schedule
   */
  private deactivateSchedule(workflowId: string): void {
    const job = this.scheduledJobs.get(workflowId);
    if (job) {
      clearTimeout(job.timer);
      this.scheduledJobs.delete(workflowId);
      logger.info(`Deactivated schedule for workflow ${workflowId}`);
    }
  }

  /**
   * Execute a scheduled workflow
   */
  private async executeScheduledWorkflow(workflowId: string, scheduleId: string): Promise<void> {
    try {
      // Execute workflow
      const result = await executeWorkflow(
        workflowId,
        { scheduleId },
        undefined, // No user context for scheduled runs
        'schedule'
      );
      
      if (result.success) {
        logger.info(`Successfully executed scheduled workflow ${workflowId}`);
      } else {
        logger.error(`Failed to execute scheduled workflow ${workflowId}: ${result.error}`);
      }
      
      // Update last run time in database
      await db.update(workflowSchedules)
        .set({
          lastRun: new Date()
        })
        .where(eq(workflowSchedules.id, scheduleId));
      
      // Check if schedule is still active
      const schedule = await db.query.workflowSchedules.findFirst({
        where: eq(workflowSchedules.id, scheduleId)
      });
      
      if (schedule && schedule.isActive) {
        // Reschedule for next run
        await this.activateSchedule(
          scheduleId,
          workflowId,
          schedule.cronExpression,
          schedule.timezone
        );
      }
    } catch (error) {
      logger.error(`Error executing scheduled workflow ${workflowId}:`, error);
      
      // Reschedule despite error
      try {
        const schedule = await db.query.workflowSchedules.findFirst({
          where: eq(workflowSchedules.id, scheduleId)
        });
        
        if (schedule && schedule.isActive) {
          await this.activateSchedule(
            scheduleId,
            workflowId,
            schedule.cronExpression,
            schedule.timezone
          );
        }
      } catch (e) {
        logger.error(`Failed to reschedule workflow ${workflowId} after error:`, e);
      }
    }
  }

  /**
   * Execute a manual trigger
   */
  async executeTrigger(
    workflowId: string,
    triggerData: any,
    userId?: number
  ): Promise<{
    success: boolean;
    executionId?: string;
    error?: string;
  }> {
    try {
      // Check if workflow exists
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, workflowId)
      });
      
      if (!workflow) {
        return {
          success: false,
          error: `Workflow ${workflowId} not found`
        };
      }
      
      // Execute workflow
      const result = await executeWorkflow(
        workflowId,
        triggerData,
        userId,
        'manual'
      );
      
      return {
        success: result.success,
        executionId: result.result?.id,
        error: result.error || undefined
      };
    } catch (error) {
      logger.error(`Error executing manual trigger for workflow ${workflowId}:`, error);
      return {
        success: false,
        error: `Manual trigger execution failed: ${error.message}`
      };
    }
  }

  /**
   * Refresh triggers for a workflow
   * Called when a workflow is updated
   */
  async refreshWorkflowTriggers(workflowId: string): Promise<void> {
    try {
      // Deactivate existing triggers
      await this.deactivateWorkflowTriggers(workflowId);
      
      // Get workflow
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, workflowId)
      });
      
      if (!workflow) {
        return;
      }
      
      // Check for webhook trigger nodes in the workflow
      const nodes = workflow.nodes as any[];
      for (const node of nodes) {
        if (node.type === 'webhook_trigger' && node.parameters) {
          const path = node.parameters.path || `/webhook/${workflowId}`;
          const method = node.parameters.httpMethod || 'POST';
          const authType = node.parameters.authentication || 'none';
          
          // Register webhook
          await this.registerWebhook(
            workflowId,
            path,
            method,
            authType,
            {}
          );
        } else if (node.type === 'schedule_trigger' && node.parameters) {
          const cronExpression = node.parameters.rule || '*/5 * * * *';
          const timezone = node.parameters.timezone || 'UTC';
          
          // Register schedule
          await this.registerSchedule(
            workflowId,
            cronExpression,
            timezone
          );
        }
      }
    } catch (error) {
      logger.error(`Error refreshing triggers for workflow ${workflowId}:`, error);
    }
  }

  /**
   * Deactivate all triggers for a workflow
   */
  async deactivateWorkflowTriggers(workflowId: string): Promise<void> {
    try {
      // Deactivate webhooks
      const webhooks = await db.query.webhookEndpoints.findMany({
        where: eq(webhookEndpoints.workflowId, workflowId)
      });
      
      for (const webhook of webhooks) {
        await this.unregisterWebhook(webhook.path);
      }
      
      // Deactivate schedules
      await this.unregisterSchedule(workflowId);
    } catch (error) {
      logger.error(`Error deactivating triggers for workflow ${workflowId}:`, error);
    }
  }

  /**
   * Get all active webhooks
   */
  getActiveWebhooks(): Map<string, string> {
    return new Map(this.activeWebhooks);
  }

  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): Map<string, Omit<ScheduledJob, 'timer'>> {
    const jobs = new Map<string, Omit<ScheduledJob, 'timer'>>();
    
    for (const [workflowId, job] of this.scheduledJobs.entries()) {
      jobs.set(workflowId, {
        workflowId: job.workflowId,
        cronExpression: job.cronExpression,
        timezone: job.timezone,
        nextRunTime: job.nextRunTime
      });
    }
    
    return jobs;
  }
}

// Singleton instance
export const triggerService = new TriggerService();
