// n8n-style workflow types for better compatibility

export interface INodeProperties {
  displayName: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'collection' | 'fixedCollection' | 'options' | 'multiOptions' | 'json' | 'dateTime' | 'color' | 'notice' | 'hidden';
  default?: any;
  required?: boolean;
  description?: string;
  placeholder?: string;
  options?: Array<{
    name: string;
    value: string | number | boolean;
    description?: string;
  }>;
  typeOptions?: {
    multipleValues?: boolean;
    loadOptionsMethod?: string;
    rows?: number;
    password?: boolean;
  };
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
}

export interface INodePropertyCollection {
  displayName: string;
  name: string;
  values: INodeProperties[];
}

export interface INodeTypeDescription {
  displayName: string;
  name: string;
  group: string[];
  version: number | number[];
  icon?: string;
  iconUrl?: string;
  description: string;
  defaults: {
    name: string;
    color?: string;
  };
  inputs: string[] | Array<{
    displayName: string;
    type: string;
    required?: boolean;
  }>;
  outputs: string[] | Array<{
    displayName: string;
    type: string;
  }>;
  properties: INodeProperties[];
  credentials?: Array<{
    name: string;
    required?: boolean;
    displayOptions?: {
      show?: Record<string, any[]>;
      hide?: Record<string, any[]>;
    };
  }>;
  webhooks?: Array<{
    name: string;
    httpMethod: string | string[];
    responseMode?: string;
    path: string;
  }>;
  polling?: boolean;
  triggerPanel?: {
    header?: string;
    executionsHelp?: {
      inactive?: string;
      active?: string;
    };
    activationHint?: string;
  };
}

export interface INodeExecutionData {
  data: {
    main: any[][];
  };
  source?: {
    main?: Array<{
      previousNode: string;
      previousNodeOutput?: number;
      previousNodeRun?: number;
    }>;
  };
}

export interface IRunExecutionData {
  resultData: {
    runData: Record<string, INodeExecutionData[]>;
    pinData?: Record<string, any[]>;
    lastNodeExecuted?: string;
    executionTime?: number;
    startTime?: Date;
    error?: Error;
  };
  executionData?: {
    contextData: Record<string, any>;
    nodeExecutionStack: Array<{
      node: INode;
      data: INodeExecutionData;
      source: {
        main?: Array<{
          previousNode: string;
        }>;
      };
    }>;
    metadata: Record<string, any>;
    waitingExecution: Record<string, any>;
    waitingExecutionSource: Record<string, any>;
  };
}

export interface INode {
  id: string;
  name: string;
  typeVersion: number;
  type: string;
  position: [number, number];
  disabled?: boolean;
  notes?: string;
  parameters: Record<string, any>;
  credentials?: Record<string, string>;
  webhookId?: string;
  continueOnFail?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
}

export interface IConnection {
  node: string;
  type: string;
  index: number;
}

export interface IConnections {
  [key: string]: {
    [key: string]: IConnection[];
  };
}

export interface IWorkflowBase {
  id?: string;
  name: string;
  nodes: INode[];
  connections: IConnections;
  active?: boolean;
  settings?: {
    saveDataErrorExecution?: string;
    saveDataSuccessExecution?: string;
    saveManualExecutions?: boolean;
    callerPolicy?: string;
    errorWorkflow?: string;
    timezone?: string;
    saveExecutionProgress?: boolean;
    executionTimeout?: number;
  };
  staticData?: Record<string, any>;
  pinData?: Record<string, any[]>;
  versionId?: string;
  meta?: {
    templateCredsSetupCompleted?: boolean;
    instanceId?: string;
  };
  tags?: string[];
}

export interface IWorkflowExecuteAdditionalData {
  credentialsHelper: any;
  executeWorkflow: any;
  restApiUrl: string;
  timezone: string;
  webhookBaseUrl: string;
  webhookWaitingBaseUrl: string;
  webhookTestBaseUrl: string;
  currentNodeParameters?: Record<string, any>;
  executionTimeoutTimestamp?: number;
  userId?: string;
}

export interface IExecuteData {
  data: INodeExecutionData;
  node: INode;
  source: {
    main?: Array<{
      previousNode: string;
      previousNodeOutput?: number;
      previousNodeRun?: number;
    }>;
  };
}

export interface INodeExecuteFunctions {
  continueOnFail(): boolean;
  evaluateExpression(expression: string, itemIndex: number): any;
  getContext(type: string): any;
  getCredentials(type: string): Promise<any>;
  getExecuteData(): IExecuteData;
  getInputData(inputIndex?: number, inputName?: string): any[];
  getNode(): INode;
  getNodeParameter(parameterName: string, itemIndex?: number, fallbackValue?: any): any;
  getRestApiUrl(): string;
  getTimezone(): string;
  getWorkflow(): IWorkflowBase;
  getWorkflowDataProxy(itemIndex: number): any;
  helpers: {
    returnJsonArray(jsonData: any): any[];
    constructExecutionMetaData(inputData: any[], options?: any): any[];
    httpRequest(requestOptions: any): Promise<any>;
    requestWithAuthentication(credentialsType: string, requestOptions: any): Promise<any>;
  };
  logger: {
    debug(message: string, extra?: any): void;
    info(message: string, extra?: any): void;
    warn(message: string, extra?: any): void;
    error(message: string, extra?: any): void;
  };
}

export interface IExecutionResult {
  success: boolean;
  error?: string;
  data?: any;
  nodeResults?: Map<string, any>;
  executionTime?: number;
  lastNodeExecuted?: string;
}

export interface IExecutionContext {
  executionId: string;
  mode: 'manual' | 'trigger' | 'webhook' | 'retry' | 'internal';
  startTime: Date;
  variables: Record<string, any>;
  credentials: Record<string, any>;
  timezone?: string;
  userId?: string;
  sessionId?: string;
  retryOf?: string;
}

// Status types for execution monitoring
export type ExecutionStatus = 'new' | 'running' | 'success' | 'error' | 'canceled' | 'crashed' | 'waiting';

export interface IExecutionSummary {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: Date;
  stoppedAt?: Date;
  workflowId: string;
  workflowName?: string;
  status: ExecutionStatus;
  nodeExecutionStatus?: Record<string, ExecutionStatus>;
}

// Webhook types
export interface IWebhookData {
  workflowId: string;
  webhookPath: string;
  node: string;
  httpMethod: string;
  webhookId?: string;
  pathLength?: number;
}

export interface IWebhookResponse {
  workflowData?: IWorkflowBase;
  webhookData?: IWebhookData;
}

// Polling types
export interface IPollData {
  workflowId: string;
  node: string;
  pollTimes: {
    startDate: Date;
    endDate: Date;
  };
}

// Credential types
export interface ICredentialType {
  name: string;
  displayName: string;
  documentationUrl?: string;
  properties: INodeProperties[];
  authenticate?: {
    type: string;
    properties: Record<string, any>;
  };
  test?: {
    request: {
      baseURL?: string;
      url?: string;
      method?: string;
      headers?: Record<string, string>;
    };
  };
}

export interface ICredentialData {
  id?: string;
  name: string;
  type: string;
  data: Record<string, any>;
  nodesAccess?: Array<{
    nodeType: string;
  }>;
}

// Version control types
export interface IWorkflowVersion {
  versionId: string;
  workflowId: string;
  nodes: INode[];
  connections: IConnections;
  createdAt: Date;
  tags?: string[];
}
