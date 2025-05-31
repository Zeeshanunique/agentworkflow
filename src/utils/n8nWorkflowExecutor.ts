// N8n-style Workflow Execution Engine
import { INodeExecutionData, INodeExecutionContext, INodeParameters } from '../data/n8nNodes/BaseNode';
import { createNodeInstance, getNodeDescription } from '../data/n8nNodeRegistry';
import { Node, Connection } from '../types';

// Execution result interface
export interface IExecutionResult {
  success: boolean;
  data?: INodeExecutionData[];
  error?: string;
  executionTime?: number;
  nodeResults?: Map<string, INodeExecutionData[]>;
}

// Workflow execution context
export interface IWorkflowExecutionContext {
  executionId: string;
  userId?: string;
  mode: 'manual' | 'webhook' | 'schedule';
  startTime: Date;
  variables: Record<string, any>;
  credentials: Record<string, any>;
}

// Node execution state
interface INodeExecutionState {
  id: string;
  name: string;
  type: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  executionTime?: number;
  inputData: INodeExecutionData[];
  outputData?: INodeExecutionData[];
  error?: string;
}

export class N8nWorkflowExecutor {
  private nodes: Map<string, Node> = new Map();
  private connections: Map<string, Connection[]> = new Map();
  private executionStates: Map<string, INodeExecutionState> = new Map();
  private executionContext: IWorkflowExecutionContext;

  constructor(executionContext: IWorkflowExecutionContext) {
    this.executionContext = executionContext;
  }

  // Load workflow definition
  loadWorkflow(nodes: Node[], connections: Connection[]): void {
    // Clear existing data
    this.nodes.clear();
    this.connections.clear();
    this.executionStates.clear();

    // Load nodes
    nodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.executionStates.set(node.id, {
        id: node.id,
        name: node.data?.name || node.type,
        type: node.type,
        status: 'waiting',
        inputData: []
      });
    });

    // Load connections - group by source node
    connections.forEach(connection => {
      if (!this.connections.has(connection.fromNodeId)) {
        this.connections.set(connection.fromNodeId, []);
      }
      this.connections.get(connection.fromNodeId)!.push(connection);
    });
  }

  // Execute the entire workflow
  async executeWorkflow(triggerData?: INodeExecutionData[]): Promise<IExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Find trigger nodes (nodes with no inputs)
      const triggerNodes = Array.from(this.nodes.values()).filter(node => {
        const nodeDescription = getNodeDescription(node.type);
        return nodeDescription?.inputs.length === 0;
      });

      if (triggerNodes.length === 0) {
        throw new Error('No trigger nodes found in workflow');
      }

      // Execute from trigger nodes
      const results = new Map<string, INodeExecutionData[]>();
      
      for (const triggerNode of triggerNodes) {
        const initialData = triggerData || [{ json: { triggered: true, timestamp: new Date().toISOString() } }];
        await this.executeNodeRecursive(triggerNode.id, initialData, results);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: Array.from(results.values()).flat(),
        executionTime,
        nodeResults: results
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        executionTime,
        nodeResults: new Map()
      };
    }
  }

  // Execute a single node and its connected nodes recursively
  private async executeNodeRecursive(
    nodeId: string, 
    inputData: INodeExecutionData[], 
    results: Map<string, INodeExecutionData[]>
  ): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const executionState = this.executionStates.get(nodeId)!;
    
    // Skip if already executed
    if (executionState.status === 'completed') {
      return;
    }

    // Execute the node
    const outputData = await this.executeNode(nodeId, inputData);
    results.set(nodeId, outputData);

    // Execute connected nodes
    const outgoingConnections = this.connections.get(nodeId) || [];
    
    for (const connection of outgoingConnections) {
      const targetNode = this.nodes.get(connection.toNodeId);
      if (targetNode) {
        // Pass output data to connected node
        await this.executeNodeRecursive(connection.toNodeId, outputData, results);
      }
    }
  }

  // Execute a single node
  private async executeNode(nodeId: string, inputData: INodeExecutionData[]): Promise<INodeExecutionData[]> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const executionState = this.executionStates.get(nodeId)!;
    executionState.status = 'running';
    executionState.startTime = new Date();
    executionState.inputData = inputData;

    try {
      // Create node instance
      const nodeInstance = createNodeInstance(node.type);
      
      // Create execution context
      const context: INodeExecutionContext = {
        node: {
          id: nodeId,
          name: node.data?.name || node.type,
          type: node.type,
          parameters: node.parameters || {}
        },
        workflow: {
          id: this.executionContext.executionId,
          name: 'Current Workflow'
        },
        execution: {
          id: this.executionContext.executionId,
          mode: this.executionContext.mode,
          startedAt: this.executionContext.startTime
        },
        inputData,
        logger: {
          info: (message: string, data?: any) => console.log(`[${nodeId}] ${message}`, data),
          warn: (message: string, data?: any) => console.warn(`[${nodeId}] ${message}`, data),
          error: (message: string, data?: any) => console.error(`[${nodeId}] ${message}`, data),
          debug: (message: string, data?: any) => console.debug(`[${nodeId}] ${message}`, data)
        },
        helpers: {
          httpRequest: this.createHttpRequestHelper(),
          getCredentials: this.createGetCredentialsHelper(),
          returnJsonArray: (data: any[]) => data.map(item => ({ json: item }))
        }
      };

      // Execute the node
      const outputData = await nodeInstance.execute(context);

      // Update execution state
      executionState.status = 'completed';
      executionState.endTime = new Date();
      executionState.executionTime = executionState.endTime.getTime() - executionState.startTime!.getTime();
      executionState.outputData = outputData;

      return outputData;

    } catch (error: any) {
      // Update execution state with error
      executionState.status = 'error';
      executionState.endTime = new Date();
      executionState.error = error.message;
      
      console.error(`Error executing node ${nodeId}:`, error);
      throw error;
    }
  }

  // Helper to create HTTP request function
  private createHttpRequestHelper() {
    return async (options: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      timeout?: number;
    }): Promise<any> => {
      const {
        url,
        method = 'GET',
        headers = {},
        body,
        timeout = 30000
      } = options;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const requestOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          signal: controller.signal
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        return {
          body: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          statusCode: response.status,
          statusMessage: response.statusText
        };

      } catch (error: any) {
        clearTimeout(timeoutId);
        throw new Error(`HTTP request failed: ${error.message}`);
      }
    };
  }

  // Helper to get credentials
  private createGetCredentialsHelper() {
    return async (credentialType: string): Promise<any> => {
      // In a real implementation, this would fetch encrypted credentials
      // For now, return from execution context
      return this.executionContext.credentials[credentialType] || {};
    };
  }

  // Get execution states for monitoring
  getExecutionStates(): Map<string, INodeExecutionState> {
    return new Map(this.executionStates);
  }

  // Get execution summary
  getExecutionSummary(): {
    totalNodes: number;
    completedNodes: number;
    errorNodes: number;
    runningNodes: number;
    waitingNodes: number;
  } {
    const states = Array.from(this.executionStates.values());
    
    return {
      totalNodes: states.length,
      completedNodes: states.filter(s => s.status === 'completed').length,
      errorNodes: states.filter(s => s.status === 'error').length,
      runningNodes: states.filter(s => s.status === 'running').length,
      waitingNodes: states.filter(s => s.status === 'waiting').length
    };
  }
}

// Factory function for creating executor instances
export function createWorkflowExecutor(
  executionContext: IWorkflowExecutionContext
): N8nWorkflowExecutor {
  return new N8nWorkflowExecutor(executionContext);
}

// Legacy compatibility function
export async function executeWorkflow(
  nodes: Node[],
  connections: Connection[],
  triggerData?: any
): Promise<IExecutionResult> {
  const context: IWorkflowExecutionContext = {
    executionId: `exec_${Date.now()}`,
    mode: 'manual',
    startTime: new Date(),
    variables: {},
    credentials: {}
  };

  const executor = createWorkflowExecutor(context);
  executor.loadWorkflow(nodes, connections);
  
  const inputData = triggerData ? [{ json: triggerData }] : undefined;
  return await executor.executeWorkflow(inputData);
}
