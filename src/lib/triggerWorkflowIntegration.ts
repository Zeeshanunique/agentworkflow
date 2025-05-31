// N8n Trigger Workflow Integration 
import { triggerDiscoveryService, TriggerNodeType, IWebhookContext, ITriggerResult } from '../services/triggerDiscovery';
import { INodeExecutionData } from '../data/n8nNodes/BaseNode';

/**
 * Integration module that connects the n8n trigger system with the workflow executor
 */

// Import existing workflow executor if available
let workflowExecutor: any;

// Define a type for the imported module to handle both default and named exports
type WorkflowExecutorModule = {
  default?: any;
  executeWorkflow?: (nodes: any[], connections: any[], triggerData?: any) => Promise<any>;
  [key: string]: any;
};

// Dynamic import to avoid circular dependencies
const importExecutor = async () => {
  try {
    // Use type assertion with unknown first to avoid direct type mismatch
    const module = await import('../utils/n8nWorkflowExecutor') as unknown as WorkflowExecutorModule;
    workflowExecutor = module.default || module;
    return true;
  } catch (error) {
    console.warn('Workflow executor not available:', error);
    return false;
  }
};

// Initialize the executor
importExecutor();

/**
 * Register all trigger nodes for a specific workflow
 * @param workflowId The ID of the workflow
 * @param triggerNodes Array of trigger node configurations
 */
export async function registerWorkflowTriggers(
  workflowId: string, 
  triggerNodes: Array<{ 
    nodeId: string; 
    type: string; 
    parameters: Record<string, any>;
    credentials?: Record<string, any>;
  }>
): Promise<boolean> {
  try {
    const results = await Promise.all(triggerNodes.map(node => {
      let triggerType: TriggerNodeType;
      
      // Map node type to TriggerNodeType enum
      if (node.type.includes('manual') || node.type.includes('Manual')) {
        triggerType = TriggerNodeType.MANUAL;
      } else if (node.type.includes('webhook') || node.type.includes('Webhook')) {
        triggerType = TriggerNodeType.WEBHOOK;
      } else if (node.type.includes('schedule') || node.type.includes('Schedule')) {
        triggerType = TriggerNodeType.SCHEDULE;
      } else if (node.type.includes('email') || node.type.includes('Email')) {
        triggerType = TriggerNodeType.EMAIL;
      } else {
        console.warn(`Unknown trigger type: ${node.type}, skipping`);
        return false;
      }
      
      return triggerDiscoveryService.registerTrigger(
        workflowId,
        node.nodeId,
        triggerType,
        node.parameters,
        node.credentials
      );
    }));
    
    const success = results.every(Boolean);
    console.log(`${success ? '✅' : '⚠️'} Registered ${results.filter(Boolean).length}/${triggerNodes.length} triggers for workflow ${workflowId}`);
    
    return success;
  } catch (error) {
    console.error('❌ Failed to register workflow triggers:', error);
    return false;
  }
}

/**
 * Unregister all triggers for a specific workflow or all workflows
 * @param workflowId The ID of the workflow or '*' to unregister all
 */
export function unregisterWorkflowTriggers(workflowId: string): boolean {
  try {
    // Get all active triggers
    const allTriggers = triggerDiscoveryService.getActiveTriggers();
    
    // Filter triggers for this workflow or get all if workflowId is '*'
    const workflowTriggers = workflowId === '*' 
      ? allTriggers
      : allTriggers.filter(trigger => trigger.context.workflowId === workflowId);
    
    // Unregister each trigger
    const results = workflowTriggers.map(trigger => 
      triggerDiscoveryService.unregisterTrigger(
        trigger.context.workflowId, 
        trigger.context.nodeId
      )
    );
    
    const success = results.every(Boolean);
    
    if (workflowId === '*') {
      console.log(`${success ? '✅' : '⚠️'} Unregistered ${results.filter(Boolean).length}/${workflowTriggers.length} triggers across all workflows`);
    } else {
      console.log(`${success ? '✅' : '⚠️'} Unregistered ${results.filter(Boolean).length}/${workflowTriggers.length} triggers for workflow ${workflowId}`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Failed to unregister workflow triggers:', error);
    return false;
  }
}

/**
 * Execute a manual workflow trigger
 * @param workflowId The ID of the workflow
 * @param nodeId The ID of the trigger node
 * @param data Optional data to pass to the trigger
 */
export async function executeManualTrigger(
  workflowId: string,
  nodeId: string,
  data?: Record<string, any>
): Promise<ITriggerResult> {
  try {
    const result = await triggerDiscoveryService.executeManualTrigger(
      workflowId,
      nodeId,
      data
    );
    
    if (result.triggered && result.data) {
      // Execute the workflow with the trigger data
      await executeWorkflowFromTrigger(workflowId, nodeId, result.data);
    }
    
    return result;
  } catch (error) {
    return {
      triggered: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle webhook requests for workflow triggers
 * @param path The webhook path
 * @param webhookContext The webhook request context
 */
export async function handleWebhookRequest(
  path: string,
  webhookContext: IWebhookContext
): Promise<ITriggerResult | null> {
  try {
    // Get all active webhook triggers
    const allTriggers = triggerDiscoveryService.getActiveTriggers()
      .filter(t => t.context.triggerType === TriggerNodeType.WEBHOOK);
    
    // Find matching webhook by path
    const matchingTrigger = allTriggers.find(trigger => {
      const triggerPath = trigger.context.parameters?.path;
      return triggerPath && path.includes(triggerPath);
    });
    
    if (!matchingTrigger) {
      return null;
    }
    
    const { workflowId, nodeId } = matchingTrigger.context;
    
    // Handle the webhook
    const result = await triggerDiscoveryService.handleWebhook(
      workflowId,
      nodeId,
      webhookContext
    );
    
    if (result.triggered && result.data) {
      // Execute the workflow with the webhook data
      await executeWorkflowFromTrigger(workflowId, nodeId, result.data);
    }
    
    return result;
  } catch (error) {
    return {
      triggered: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute a workflow from a trigger event
 * @param workflowId The ID of the workflow
 * @param triggerNodeId The ID of the trigger node
 * @param data The data from the trigger
 */
async function executeWorkflowFromTrigger(
  workflowId: string,
  triggerNodeId: string,
  data: INodeExecutionData[][]
): Promise<void> {
  try {
    if (!workflowExecutor) {
      console.warn('⚠️ Workflow executor not available, skipping execution');
      console.log(`📊 Trigger data for workflow ${workflowId}:`, data);
      return;
    }
    
    // Create execution context
    const executionContext = {
      workflowId,
      triggerNodeId,
      triggerData: data,
      executionId: `exec_${Date.now()}`,
      startedAt: new Date(),
      userId: 'system'
    };
    
    console.log(`🚀 Starting workflow execution for ${workflowId} from trigger ${triggerNodeId}`);
    
    // Execute the workflow
    await workflowExecutor.executeWorkflow(executionContext);
    
  } catch (error) {
    console.error(`❌ Error executing workflow ${workflowId} from trigger:`, error);
  }
}

/**
 * Get trigger statistics
 */
export function getTriggerStatistics() {
  return triggerDiscoveryService.getTriggerStatistics();
}

/**
 * Cleanup all triggers (useful for shutdown)
 */
export function cleanupAllTriggers() {
  return triggerDiscoveryService.cleanup();
}
