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
  name: string;
  description: string;
  position: Position;
  nodeType: NodeType;
  inputs: Port[];
  outputs: Port[];
  parameters?: Record<string, string>;
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
}
