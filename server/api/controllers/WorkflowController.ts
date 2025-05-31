import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/db';
import { workflows, workflowExecutions } from '../../db/schema';
import { executeWorkflow } from '../../lib/WorkflowExecutor';
import { triggerService } from '../../services/TriggerService';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * WorkflowController
 * Handles API endpoints for workflow management
 */
export class WorkflowController {
  /**
   * Get all workflows
   */
  async getAllWorkflows(req: Request, res: Response) {
    try {
      const allWorkflows = await db.query.workflows.findMany({
        orderBy: (workflows, { desc }) => [desc(workflows.updatedAt)]
      });
      
      return res.status(200).json(allWorkflows);
    } catch (error) {
      logger.error('Error getting workflows:', error);
      return res.status(500).json({ error: 'Failed to get workflows' });
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, id)
      });
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      return res.status(200).json(workflow);
    } catch (error) {
      logger.error(`Error getting workflow ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to get workflow' });
    }
  }

  /**
   * Create new workflow
   */
  async createWorkflow(req: Request, res: Response) {
    try {
      const { name, description, nodes, edges, active } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Workflow name is required' });
      }
      
      const result = await db.insert(workflows)
        .values({
          id: uuidv4(),
          name,
          description: description || '',
          nodes: nodes || [],
          edges: edges || [],
          active: active !== undefined ? active : true,
          userId: req.user ? (req.user as any).id : null
        })
        .returning({ id: workflows.id });
      
      const workflowId = result[0].id;
      
      // Check for trigger nodes and register them
      if (nodes && nodes.length > 0) {
        await triggerService.refreshWorkflowTriggers(workflowId);
      }
      
      return res.status(201).json({ id: workflowId });
    } catch (error) {
      logger.error('Error creating workflow:', error);
      return res.status(500).json({ error: 'Failed to create workflow' });
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, nodes, edges, active } = req.body;
      
      // Check if workflow exists
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, id)
      });
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      // Update workflow
      await db.update(workflows)
        .set({
          name: name !== undefined ? name : workflow.name,
          description: description !== undefined ? description : workflow.description,
          nodes: nodes !== undefined ? nodes : workflow.nodes,
          edges: edges !== undefined ? edges : workflow.edges,
          active: active !== undefined ? active : workflow.active,
          updatedAt: new Date()
        })
        .where(eq(workflows.id, id));
      
      // Refresh triggers if nodes were updated
      if (nodes !== undefined) {
        await triggerService.refreshWorkflowTriggers(id);
      }
      
      return res.status(200).json({ id });
    } catch (error) {
      logger.error(`Error updating workflow ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to update workflow' });
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if workflow exists
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, id)
      });
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      // Deactivate triggers first
      await triggerService.deactivateWorkflowTriggers(id);
      
      // Delete workflow
      await db.delete(workflows)
        .where(eq(workflows.id, id));
      
      return res.status(200).json({ success: true });
    } catch (error) {
      logger.error(`Error deleting workflow ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to delete workflow' });
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { inputData = {} } = req.body;
      
      // Check if workflow exists
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, id)
      });
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      // Create execution record
      const executionId = uuidv4();
      
      await db.insert(workflowExecutions).values({
        id: executionId,
        workflowId: id,
        userId: req.user ? (req.user as any).id : null,
        status: 'running',
        startTime: new Date(),
        mode: 'manual',
      });
      
      // Execute workflow asynchronously
      executeWorkflow(
        id,
        inputData,
        req.user ? (req.user as any).id : undefined,
        'manual',
        executionId
      ).catch(error => {
        logger.error(`Error executing workflow ${id}:`, error);
      });
      
      return res.status(202).json({ 
        executionId,
        message: 'Workflow execution started'
      });
    } catch (error) {
      logger.error(`Error executing workflow ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to execute workflow' });
    }
  }

  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Check if workflow exists
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, id)
      });
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      // Get executions
      const executions = await db.query.workflowExecutions.findMany({
        where: eq(workflowExecutions.workflowId, id),
        orderBy: (workflowExecutions, { desc }) => [desc(workflowExecutions.startTime)],
        limit,
        offset
      });
      
      // Get total count
      const countResult = await db.select({ count: workflowExecutions.id.count() })
        .from(workflowExecutions)
        .where(eq(workflowExecutions.workflowId, id));
      
      const total = countResult[0]?.count || 0;
      
      return res.status(200).json({
        executions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    } catch (error) {
      logger.error(`Error getting executions for workflow ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to get workflow executions' });
    }
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(req: Request, res: Response) {
    try {
      const { workflowId, executionId } = req.params;
      
      const execution = await db.query.workflowExecutions.findFirst({
        where: (workflowExecutions, { and, eq }) => and(
          eq(workflowExecutions.id, executionId),
          eq(workflowExecutions.workflowId, workflowId)
        )
      });
      
      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }
      
      return res.status(200).json(execution);
    } catch (error) {
      logger.error(`Error getting execution ${req.params.executionId}:`, error);
      return res.status(500).json({ error: 'Failed to get execution' });
    }
  }

  /**
   * Activate/deactivate workflow
   */
  async setWorkflowActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      if (active === undefined) {
        return res.status(400).json({ error: 'Active status is required' });
      }
      
      // Check if workflow exists
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, id)
      });
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      // Update active status
      await db.update(workflows)
        .set({
          active: !!active,
          updatedAt: new Date()
        })
        .where(eq(workflows.id, id));
      
      // Refresh triggers based on active status
      if (active) {
        await triggerService.refreshWorkflowTriggers(id);
      } else {
        await triggerService.deactivateWorkflowTriggers(id);
      }
      
      return res.status(200).json({ 
        id,
        active: !!active
      });
    } catch (error) {
      logger.error(`Error setting workflow ${req.params.id} active status:`, error);
      return res.status(500).json({ error: 'Failed to update workflow active status' });
    }
  }
}

// Export singleton instance
export const workflowController = new WorkflowController();
