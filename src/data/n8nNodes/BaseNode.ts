/**
 * Base Node class following n8n's architecture
 * All nodes inherit from this base class to ensure consistency
 */

export interface INodeParameters {
  [key: string]: any;
}

export interface INodeProperties {
  displayName: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'collection' | 'options' | 'multiOptions' | 'json' | 'color' | 'dateTime' | 'credentialsSelect' | 'hidden';
  required?: boolean;
  default?: any;
  description?: string;
  options?: Array<{
    name: string;
    value: string | number | boolean;
    description?: string;
  }>;
  placeholder?: string;
  routing?: any;
  credentials?: string[];
  displayOptions?: {
    show?: { [key: string]: any };
    hide?: { [key: string]: any };
  };
}

export interface INodeCredential {
  name: string;
  required?: boolean;
  displayOptions?: {
    show?: { [key: string]: any };
    hide?: { [key: string]: any };
  };
}

export interface INodeTypeData {
  description: INodeTypeDescription;
}

export interface INodeTypeDescription {
  displayName: string;
  name: string;
  icon?: string;
  group: string[];
  version: number | number[];
  subtitle?: string;
  description: string;
  defaults: {
    name: string;
    color?: string;
  };
  inputs: string[] | Array<{
    displayName: string;
    type: string;
    required?: boolean;
  }>;  outputs: string[] | Array<{
    displayName: string;
    type: string;
  }>;
  credentials?: INodeCredential[];
  properties: INodeProperties[];
  polling?: boolean;
  webhook?: boolean;
  trigger?: boolean;
  requestDefaults?: {
    returnFullResponse?: boolean;
    baseURL?: string;
  };
}

export interface IExecuteWorkflowInfo {
  code?: IWorkflowDataProxyData;
  restApiUrl?: string;
  timezone: string;
  webhookBaseUrl: string;
  webhookTestBaseUrl: string;
  webhookWaitingBaseUrl: string;
  currentNodeParameters?: INodeParameters;
  executionTimeoutTimestamp?: number;
  userId?: string;
}

export interface IWorkflowDataProxyData {
  [key: string]: any;
  $binary: any;
  $data: any;
  $env: any;
  $evaluateExpression: (expression: string, itemIndex?: number) => any;
  $item: (itemIndex: number, runIndex?: number) => any;
  $items: (nodeName?: string, outputIndex?: number, runIndex?: number) => any;
  $json: any;
  $node: any;
  $parameter: any;
  $position: number;
  $runIndex: number;
  $workflow: any;
}

export interface INodeExecutionData {
  [key: string]: any;
  data?: {
    main?: any[][];
  };
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Base interface for all node types in the n8n-style architecture
 */
export abstract class BaseNode {
  description: INodeTypeDescription;

  constructor(description: INodeTypeDescription) {
    this.description = description;
  }

  /**
   * Execute the node logic
   */
  abstract execute(
    this: any,
    inputData: INodeExecutionData[][],
    context: IExecuteWorkflowInfo
  ): Promise<INodeExecutionData[][]>;

  /**
   * Webhook execution method for webhook-based nodes
   */
  webhook?(this: any, context: any): Promise<any>;

  /**
   * Poll method for polling-based trigger nodes
   */
  poll?(this: any, context: any): Promise<INodeExecutionData[][]>;

  /**
   * Test webhook method
   */
  webhookTest?(this: any, context: any): Promise<any>;
}

/**
 * Node execution context that provides utility functions and data access
 */
export interface INodeExecutionContext {
  getInputData(inputIndex?: number): any[];
  getNodeParameter(parameterName: string, itemIndex?: number, fallbackValue?: any): any;
  getCredentials(type: string): Promise<any>;
  getWorkflowStaticData(type: string): any;
  helpers: {
    httpRequest(requestOptions: any): Promise<any>;
    returnJsonArray(jsonData: any[]): any[];
    constructExecutionMetaData(inputData: any[], options: any): any[];
  };
  logger: {
    debug(message: string, extra?: any): void;
    info(message: string, extra?: any): void;
    warn(message: string, extra?: any): void;
    error(message: string, extra?: any): void;
  };
}

/**
 * Utility function to create node properties
 */
export function createNodeProperties(properties: Partial<INodeProperties>[]): INodeProperties[] {
  return properties.map(prop => ({
    displayName: prop.displayName || '',
    name: prop.name || '',
    type: prop.type || 'string',
    required: prop.required || false,
    default: prop.default || '',
    description: prop.description || '',
    ...prop
  }));
}

/**
 * Utility function to create standard input/output configurations
 */
export const StandardInputs = {
  main: ['main'],
  trigger: [],
  webhook: []
};

export const StandardOutputs = {
  main: ['main'],
  trigger: ['main'],
  webhook: ['main']
};

/**
 * Common node groups for categorization
 */
export const NodeGroups = {
  TRIGGER: ['trigger'] as string[],
  REGULAR: ['regular'] as string[],
  OUTPUT: ['output'] as string[],
  TRANSFORM: ['transform'] as string[],
  INPUT: ['input'] as string[],
  AGENT: ['ai', 'agent'] as string[]
} as const;
