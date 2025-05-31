import { Node, Connection, WorkflowExecutionResult } from '../../src/types';
import { workflows, workflowExecutions } from '../db/schema';
import { db } from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

/**
 * Workflow execution state
 */
export interface IExecutionState {
  id: string;
  workflowId: string;
  userId?: number;
  status: 'waiting' | 'running' | 'completed' | 'error' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  mode: 'manual' | 'webhook' | 'schedule';
  executionData: {
    nodeExecutions: Record<string, {
      status: 'waiting' | 'running' | 'completed' | 'error';
      startTime?: Date;
      endTime?: Date;
      input?: any;
      output?: any;
      error?: string;
    }>;
    currentNodeId?: string;
    variables: Record<string, any>;
    executedNodes: string[];
  };
  inputData?: any;
  outputData?: any;
  error?: string;
}

// This emits events for workflow execution progress
export const workflowEvents = new EventEmitter();

/**
 * Main WorkflowExecutor class - handles execution of workflows
 * Modeled after n8n's architecture with synchronous node execution
 * and proper state tracking
 */
export class WorkflowExecutor {
  private executionState: IExecutionState;
  private nodes: Map<string, Node> = new Map();
  private nodeConnections: Map<string, { sources: string[], targets: string[] }> = new Map();
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  constructor(
    workflowId: string, 
    mode: 'manual' | 'webhook' | 'schedule' = 'manual',
    userId?: number,
    executionId?: string,
    maxRetries = 3,
    retryDelay = 1000
  ) {
    this.executionState = {
      id: executionId || uuidv4(),
      workflowId,
      userId,
      status: 'waiting',
      startTime: new Date(),
      mode,
      executionData: {
        nodeExecutions: {},
        variables: {},
        executedNodes: []
      }
    };
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Load workflow nodes and connections
   */
  async loadWorkflow(): Promise<boolean> {
    try {
      // Get workflow from database
      const workflow = await db.query.workflows.findFirst({
        where: (fields, { eq }) => eq(fields.id, this.executionState.workflowId)
      });

      if (!workflow) {
        throw new Error(`Workflow with ID ${this.executionState.workflowId} not found`);
      }

      // Load nodes and connections from workflow
      const nodes = workflow.nodes as unknown as Node[];
      const connections = workflow.edges as unknown as Connection[];

      // Store nodes in map for quick access
      nodes.forEach(node => {
        this.nodes.set(node.id, node);
        
        // Initialize node execution state
        this.executionState.executionData.nodeExecutions[node.id] = {
          status: 'waiting'
        };
        
        // Initialize connections map
        this.nodeConnections.set(node.id, {
          sources: [],
          targets: []
        });
      });

      // Process connections
      connections.forEach(connection => {
        const sourceNodeId = connection.fromNodeId;
        const targetNodeId = connection.toNodeId;
        
        // Add source to target node's sources
        const targetConnections = this.nodeConnections.get(targetNodeId);
        if (targetConnections) {
          targetConnections.sources.push(sourceNodeId);
        }
        
        // Add target to source node's targets
        const sourceConnections = this.nodeConnections.get(sourceNodeId);
        if (sourceConnections) {
          sourceConnections.targets.push(targetNodeId);
        }
      });

      return true;
    } catch (error) {
      logger.error('Error loading workflow:', error);
      this.executionState.status = 'error';
      this.executionState.error = `Error loading workflow: ${error.message}`;
      return false;
    }
  }

  /**
   * Execute the workflow
   */
  async execute(initialData?: any): Promise<WorkflowExecutionResult> {
    try {
      // Mark execution as started
      this.executionState.status = 'running';
      this.executionState.startTime = new Date();
      this.executionState.inputData = initialData;
      
      // Create execution record in database
      await this.saveExecutionState();
      
      // Emit execution started event
      workflowEvents.emit('execution.started', {
        executionId: this.executionState.id,
        workflowId: this.executionState.workflowId
      });

      // Find trigger/start nodes (nodes with no incoming connections)
      const startNodeIds = Array.from(this.nodeConnections.entries())
        .filter(([_, connections]) => connections.sources.length === 0)
        .map(([nodeId]) => nodeId);

      if (startNodeIds.length === 0) {
        throw new Error('No start nodes found in workflow');
      }

      // Execute start nodes with the initial data
      for (const nodeId of startNodeIds) {
        await this.executeNode(nodeId, initialData);
      }

      // Finalize execution
      this.executionState.status = 'completed';
      this.executionState.endTime = new Date();
      
      // Save final state to database
      await this.saveExecutionState();
      
      // Emit execution completed event
      workflowEvents.emit('execution.completed', {
        executionId: this.executionState.id,
        workflowId: this.executionState.workflowId,
        status: 'completed'
      });

      // Return execution result
      return {
        success: true,
        result: this.executionState.executionData,
        error: null
      };
    } catch (error) {
      // Handle execution error
      this.executionState.status = 'error';
      this.executionState.endTime = new Date();
      this.executionState.error = error.message;
      
      // Save error state to database
      await this.saveExecutionState();
      
      // Emit execution error event
      workflowEvents.emit('execution.error', {
        executionId: this.executionState.id,
        workflowId: this.executionState.workflowId,
        error: error.message
      });

      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(nodeId: string, inputData: any, retryCount = 0): Promise<any> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    // Update node execution state
    this.executionState.executionData.currentNodeId = nodeId;
    this.executionState.executionData.nodeExecutions[nodeId].status = 'running';
    this.executionState.executionData.nodeExecutions[nodeId].startTime = new Date();
    this.executionState.executionData.nodeExecutions[nodeId].input = inputData;
    
    // Save progress to database
    await this.saveExecutionState();
    
    // Emit node execution started event
    workflowEvents.emit('node.started', {
      executionId: this.executionState.id,
      workflowId: this.executionState.workflowId,
      nodeId,
      nodeName: node.name || node.type
    });

    try {
      // Import and instantiate the node type dynamically
      const nodeType = node.type;
      const nodeModule = await this.loadNodeModule(nodeType);
      
      if (!nodeModule || !nodeModule.execute) {
        throw new Error(`Node type ${nodeType} not found or invalid`);
      }

      // Execute the node
      const nodeOutput = await nodeModule.execute({
        node,
        inputData,
        executionId: this.executionState.id,
        workflowId: this.executionState.workflowId,
        nodeConnections: this.nodeConnections.get(nodeId)
      });

      // Update node execution state with output
      this.executionState.executionData.nodeExecutions[nodeId].status = 'completed';
      this.executionState.executionData.nodeExecutions[nodeId].endTime = new Date();
      this.executionState.executionData.nodeExecutions[nodeId].output = nodeOutput;
      this.executionState.executionData.executedNodes.push(nodeId);
      
      // Save progress to database
      await this.saveExecutionState();
      
      // Emit node execution completed event
      workflowEvents.emit('node.completed', {
        executionId: this.executionState.id,
        workflowId: this.executionState.workflowId,
        nodeId,
        nodeName: node.name || node.type
      });

      // Execute connected nodes (downstream)
      const connections = this.nodeConnections.get(nodeId);
      if (connections && connections.targets.length > 0) {
        for (const targetNodeId of connections.targets) {
          await this.executeNode(targetNodeId, nodeOutput);
        }
      }

      return nodeOutput;
    } catch (error) {
      // Handle node execution error
      this.executionState.executionData.nodeExecutions[nodeId].status = 'error';
      this.executionState.executionData.nodeExecutions[nodeId].endTime = new Date();
      this.executionState.executionData.nodeExecutions[nodeId].error = error.message;
      
      // Emit node execution error event
      workflowEvents.emit('node.error', {
        executionId: this.executionState.id,
        workflowId: this.executionState.workflowId,
        nodeId,
        nodeName: node.name || node.type,
        error: error.message
      });

      // Implement retry logic if configured
      if (retryCount < this.maxRetries && node.retryOnFail) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Retry execution
        return this.executeNode(nodeId, inputData, retryCount + 1);
      }

      // If error should be propagated, rethrow
      if (!node.continueOnFail) {
        throw error;
      }

      // Otherwise return null result and continue workflow
      return null;
    }
  }

  /**
   * Dynamically load a node module
   */
  private async loadNodeModule(nodeType: string): Promise<any> {
    try {
      // Try to load from core nodes first
      try {
        return await import(`../../src/data/nodes/${nodeType}`);
      } catch (e) {
        // Not a core node, continue
      }

      // Try to load from installed nodes
      // Query installed nodes from database
      const installedNode = await db.query.installedNodes.findFirst({
        where: (fields, { eq }) => eq(fields.nodeType, nodeType),
        with: {
          package: true
        }
      });

      if (installedNode) {
        // Load from installed package path
        return await import(`../../node_modules/${installedNode.package.packageName}`);
      }

      // Try to load from custom nodes directory
      try {
        return await import(`../../.n8n/custom/${nodeType}`);
      } catch (e) {
        // Not a custom node
      }

      throw new Error(`Node type ${nodeType} not found`);
    } catch (error) {
      logger.error(`Error loading node module ${nodeType}:`, error);
      throw new Error(`Failed to load node module ${nodeType}: ${error.message}`);
    }
  }

  /**
   * Save the current execution state to the database
   */
  private async saveExecutionState(): Promise<void> {
    try {
      // Check if execution record exists
      const existingExecution = await db.query.workflowExecutions.findFirst({
        where: (fields, { eq }) => eq(fields.id, this.executionState.id)
      });

      if (existingExecution) {
        // Update existing record
        await db.update(workflowExecutions)
          .set({
            status: this.executionState.status,
            endTime: this.executionState.endTime,
            outputData: this.executionState.outputData as any,
            error: this.executionState.error,
            nodeResults: this.executionState.executionData as any,
            executionTime: this.executionState.endTime 
              ? Math.round(this.executionState.endTime.getTime() - this.executionState.startTime.getTime()) 
              : undefined
          })
          .where(fields => fields.id.equals(this.executionState.id));
      } else {
        // Create new record
        await db.insert(workflowExecutions)
          .values({
            id: this.executionState.id,
            workflowId: this.executionState.workflowId,
            userId: this.executionState.userId,
            status: this.executionState.status,
            startTime: this.executionState.startTime,
            endTime: this.executionState.endTime,
            mode: this.executionState.mode,
            inputData: this.executionState.inputData as any,
            outputData: this.executionState.outputData as any,
            error: this.executionState.error,
            nodeResults: this.executionState.executionData as any,
            executionTime: this.executionState.endTime 
              ? Math.round(this.executionState.endTime.getTime() - this.executionState.startTime.getTime()) 
              : undefined
          });
      }
    } catch (error) {
      logger.error('Error saving execution state:', error);
      // Don't throw here to prevent breaking execution flow
    }
  }

  /**
   * Get the current execution state
   */
  getExecutionState(): IExecutionState {
    return this.executionState;
  }
}

/**
 * Factory function to create and initialize a workflow executor
 */
export async function createWorkflowExecutor(
  workflowId: string,
  mode: 'manual' | 'webhook' | 'schedule' = 'manual',
  userId?: number,
  executionId?: string,
  options?: { maxRetries?: number, retryDelay?: number }
): Promise<WorkflowExecutor> {
  const executor = new WorkflowExecutor(
    workflowId,
    mode,
    userId,
    executionId,
    options?.maxRetries,
    options?.retryDelay
  );
  
  // Load the workflow
  await executor.loadWorkflow();
  
  return executor;
}

/**
 * Execute a workflow by ID
 */
export async function executeWorkflow(
  workflowId: string,
  inputData?: any,
  userId?: number,
  mode: 'manual' | 'webhook' | 'schedule' = 'manual'
): Promise<WorkflowExecutionResult> {
  const executor = await createWorkflowExecutor(workflowId, mode, userId);
  return await executor.execute(inputData);
}
