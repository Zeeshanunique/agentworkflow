// N8n Trigger Node Discovery and Management Service
import { ManualTriggerNode, WebhookTriggerNode, ScheduleTriggerNode, EmailTriggerNode } from '../data/n8nNodes/triggers';
import { nodeRegistry } from '../data/n8nNodeRegistry';
import { INodeTypeDescription, INodeExecutionData, INodeExecutionContext } from '../data/n8nNodes/BaseNode';

// Trigger node types enumeration
export enum TriggerNodeType {
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  EMAIL = 'email'
}

// Trigger execution context interface
export interface ITriggerExecutionContext {
  workflowId: string;
  nodeId: string;
  triggerType: TriggerNodeType;
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

// Trigger result interface
export interface ITriggerResult {
  triggered: boolean;
  data?: INodeExecutionData[][];
  error?: string;
  nextPollTime?: Date;
}

// Webhook context interface
export interface IWebhookContext {
  method: string;
  path: string;
  body: any;
  headers: Record<string, string>;
  query: Record<string, string>;
  params: Record<string, string>;
  baseUrl: string;
}

// Main trigger node discovery service
export class TriggerNodeDiscoveryService {
  private static instance: TriggerNodeDiscoveryService;
  private triggerNodes: Map<string, any> = new Map();
  private activeTriggers: Map<string, ITriggerExecutionContext> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeTriggerNodes();
  }

  public static getInstance(): TriggerNodeDiscoveryService {
    if (!TriggerNodeDiscoveryService.instance) {
      TriggerNodeDiscoveryService.instance = new TriggerNodeDiscoveryService();
    }
    return TriggerNodeDiscoveryService.instance;
  }

  // Initialize trigger node instances
  private initializeTriggerNodes(): void {
    this.triggerNodes.set('Manual Trigger', new ManualTriggerNode());
    this.triggerNodes.set('Webhook Trigger', new WebhookTriggerNode());
    this.triggerNodes.set('Schedule Trigger', new ScheduleTriggerNode());
    this.triggerNodes.set('Email Trigger', new EmailTriggerNode());
  }

  // Discover all available trigger nodes
  public discoverTriggerNodes(): INodeTypeDescription[] {
    const triggerDescriptions: INodeTypeDescription[] = [];
    
    for (const [nodeName, nodeDesc] of Object.entries(nodeRegistry)) {
      if (nodeDesc.trigger === true) {
        triggerDescriptions.push(nodeDesc);
      }
    }

    return triggerDescriptions;
  }

  // Register a trigger for a workflow
  public async registerTrigger(
    workflowId: string,
    nodeId: string,
    triggerType: TriggerNodeType,
    parameters: Record<string, any>,
    credentials?: Record<string, any>
  ): Promise<boolean> {
    try {
      const context: ITriggerExecutionContext = {
        workflowId,
        nodeId,
        triggerType,
        parameters,
        credentials
      };

      this.activeTriggers.set(`${workflowId}-${nodeId}`, context);

      // Set up polling for schedule and email triggers
      if (triggerType === TriggerNodeType.SCHEDULE || triggerType === TriggerNodeType.EMAIL) {
        await this.setupPolling(context);
      }

      console.log(`✅ Trigger registered: ${triggerType} for workflow ${workflowId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to register trigger:', error);
      return false;
    }
  }

  // Unregister a trigger
  public unregisterTrigger(workflowId: string, nodeId: string): boolean {
    try {
      const triggerKey = `${workflowId}-${nodeId}`;
      
      // Clear polling interval if exists
      const interval = this.pollingIntervals.get(triggerKey);
      if (interval) {
        clearInterval(interval);
        this.pollingIntervals.delete(triggerKey);
      }

      // Remove from active triggers
      this.activeTriggers.delete(triggerKey);
      
      console.log(`✅ Trigger unregistered for workflow ${workflowId}, node ${nodeId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to unregister trigger:', error);
      return false;
    }
  }

  // Execute manual trigger
  public async executeManualTrigger(
    workflowId: string,
    nodeId: string,
    executionData?: Record<string, any>
  ): Promise<ITriggerResult> {
    try {
      const triggerNode = this.triggerNodes.get('Manual Trigger') as ManualTriggerNode;
      
      const mockContext = this.createMockExecutionContext({
        executionData: executionData || {}
      });

      const result = await triggerNode.execute.call(mockContext);
      
      return {
        triggered: true,
        data: result
      };
    } catch (error) {
      return {
        triggered: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Handle webhook trigger
  public async handleWebhook(
    workflowId: string,
    nodeId: string,
    webhookContext: IWebhookContext
  ): Promise<ITriggerResult> {
    try {
      const triggerKey = `${workflowId}-${nodeId}`;
      const triggerContext = this.activeTriggers.get(triggerKey);
      
      if (!triggerContext) {
        return {
          triggered: false,
          error: 'Webhook trigger not registered'
        };
      }

      const triggerNode = this.triggerNodes.get('Webhook Trigger') as WebhookTriggerNode;
      
      const mockContext = this.createMockExecutionContext(triggerContext.parameters);
      
      const result = await triggerNode.webhook.call(mockContext, webhookContext);
      
      return {
        triggered: true,
        data: result.workflowData
      };
    } catch (error) {
      return {
        triggered: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Setup polling for schedule and email triggers
  private async setupPolling(context: ITriggerExecutionContext): Promise<void> {
    const triggerKey = `${context.workflowId}-${context.nodeId}`;
    
    // Clear existing interval if any
    const existingInterval = this.pollingIntervals.get(triggerKey);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Determine polling interval
    let pollIntervalMs = 60000; // Default 1 minute
    
    if (context.triggerType === TriggerNodeType.SCHEDULE) {
      const interval = context.parameters.triggerInterval;
      switch (interval) {
        case 'everyMinute':
          pollIntervalMs = 60000;
          break;
        case 'every5Minutes':
          pollIntervalMs = 300000;
          break;
        case 'every10Minutes':
          pollIntervalMs = 600000;
          break;
        case 'every30Minutes':
          pollIntervalMs = 1800000;
          break;
        case 'everyHour':
          pollIntervalMs = 3600000;
          break;
        case 'everyDay':
          pollIntervalMs = 86400000;
          break;
      }
    } else if (context.triggerType === TriggerNodeType.EMAIL) {
      pollIntervalMs = 300000; // 5 minutes for email
    }

    // Set up polling
    const interval = setInterval(async () => {
      await this.pollTrigger(context);
    }, pollIntervalMs);

    this.pollingIntervals.set(triggerKey, interval);
    console.log(`✅ Polling setup for ${context.triggerType} trigger (${pollIntervalMs}ms interval)`);
  }

  // Poll a trigger (for schedule and email triggers)
  private async pollTrigger(context: ITriggerExecutionContext): Promise<void> {
    try {
      let triggerNode: any;
      let mockContext: any;

      if (context.triggerType === TriggerNodeType.SCHEDULE) {
        triggerNode = this.triggerNodes.get('Schedule Trigger') as ScheduleTriggerNode;
        mockContext = this.createMockExecutionContext(context.parameters);
        
        const result = await triggerNode.poll.call(mockContext);
        if (result.length > 0 && result[0].length > 0) {
          console.log(`🚀 Schedule trigger fired for workflow ${context.workflowId}`);
          // Here you would trigger the workflow execution
          this.notifyWorkflowExecution(context.workflowId, result);
        }
      } else if (context.triggerType === TriggerNodeType.EMAIL) {
        triggerNode = this.triggerNodes.get('Email Trigger') as EmailTriggerNode;
        mockContext = this.createMockExecutionContext(context.parameters);
        
        const result = await triggerNode.poll.call(mockContext);
        if (result.length > 0 && result[0].length > 0) {
          console.log(`📧 Email trigger fired for workflow ${context.workflowId}`);
          // Here you would trigger the workflow execution
          this.notifyWorkflowExecution(context.workflowId, result);
        }
      }
    } catch (error) {
      console.error(`❌ Polling error for ${context.triggerType}:`, error);
    }
  }

  // Create mock execution context for trigger nodes
  private createMockExecutionContext(parameters: Record<string, any>): INodeExecutionContext {
    return {
      getNodeParameter: (name: string, index: number, defaultValue?: any) => {
        return parameters[name] ?? defaultValue;
      },
      getCredentials: async (type: string) => {
        return {
          apiKey: 'mock-api-key',
          username: 'mock-user',
          password: 'mock-pass'
        };
      },
      helpers: {
        constructExecutionMetaData: (data: any[], options?: any) => `mock_execution_${Date.now()}`,
        httpRequest: async (options: any) => {
          return {
            choices: [{ message: { content: 'Mock response' } }],
            status: 200,
            data: { success: true }
          };
        }
      }
    } as INodeExecutionContext;
  }

  // Notify workflow execution system (placeholder)
  private notifyWorkflowExecution(workflowId: string, triggerData: INodeExecutionData[][]): void {
    console.log(`🔔 Notifying workflow execution for ${workflowId}`, triggerData);
    // In a real implementation, this would integrate with the workflow execution service
    // For now, we just log the notification
  }

  // Get all active triggers
  public getActiveTriggers(): Array<{ key: string; context: ITriggerExecutionContext }> {
    return Array.from(this.activeTriggers.entries()).map(([key, context]) => ({
      key,
      context
    }));
  }

  // Get trigger statistics
  public getTriggerStatistics(): {
    totalTriggers: number;
    triggersByType: Record<string, number>;
    pollingTriggers: number;
  } {
    const triggersByType: Record<string, number> = {};
    
    for (const context of this.activeTriggers.values()) {
      triggersByType[context.triggerType] = (triggersByType[context.triggerType] || 0) + 1;
    }

    return {
      totalTriggers: this.activeTriggers.size,
      triggersByType,
      pollingTriggers: this.pollingIntervals.size
    };
  }

  // Cleanup all triggers
  public cleanup(): void {
    // Clear all polling intervals
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval);
    }
    
    this.pollingIntervals.clear();
    this.activeTriggers.clear();
    
    console.log('✅ Trigger service cleanup completed');
  }
}

// Export singleton instance
export const triggerDiscoveryService = TriggerNodeDiscoveryService.getInstance();
