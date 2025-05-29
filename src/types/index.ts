// Define icon types for nodes
export type NodeIconType =
  | "key"
  | "brain"
  | "image"
  | "share"
  | "file-text"
  | "messageSquare"
  | "mail"
  | "globe"
  | "webhook"
  | "database"
  | "send"
  | "gauge"
  | "bot"
  | "chevronRight"
  | "filter"
  | "barChart"
  | "users"
  | "messageCircle"
  | "calendar"
  | "target"
  | "megaphone";

export interface Position {
  x: number;
  y: number;
}

export interface Port {
  id: string;
  name: string;
  type: string;
}

export interface NodeType {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: NodeIconType;
  colorClass: string;
  inputs: Port[];
  outputs: Port[];
  defaultParameters?: Record<string, string>;
}

export interface Node {
  id: string;
  type: string;
  position: Position;
  parameters?: Record<string, any>;
  data?: {
    name?: string;
    description?: string;
    nodeType?: NodeType;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Record<string, any>;
  };
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface NodeCategory {
  id: string;
  name: string;
  nodes: {
    type: string;
    name: string;
    description: string;
    icon: NodeIconType;
    colorClass: string;
  }[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  connections: Connection[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
  isPublic?: boolean;
}

// Workflow structure types
export interface WorkflowNode {
  id: string;
  type: string;
  parameters: Record<string, any>;
  position: Position;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPortId: string;
  toPortId: string;
  createdAt: string;
}

export interface WorkflowStructure {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

// LangGraph types
export interface LangGraphState {
  messages: any[];
  currentNodeId: string | null;
  executedNodes: string[];
  nodeOutputs: Record<string, any>;
  error?: string;
}

export interface WorkflowExecutionResult {
  success: boolean;
  result: LangGraphState | null;
  error: string | null;
}

export interface LangSmithRun {
  id: string;
  name: string;
  run_type: string;
  start_time: string;
  end_time: string;
  error?: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  trace_id: string;
  dotted_order: number;
  status: "success" | "error" | "in_progress" | "cancelled";
  parent_run_id?: string;
  execution_order: number;
  serialized: Record<string, any>;
  extra: Record<string, any>;
}
