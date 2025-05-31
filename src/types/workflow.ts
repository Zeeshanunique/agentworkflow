export interface Port {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  name: string;
  type: string;
  description?: string;
  position: Position;
  inputs: Port[];
  outputs: Port[];
  parameters?: Record<string, any>;
}

export interface Edge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
}

export interface Workflow {
  id?: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  isPublic?: boolean;
} 