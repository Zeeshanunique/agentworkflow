import { NodeType, Port } from "../../types";

/**
 * Interface for node execution data
 */
export interface INodeExecutionData {
  json: Record<string, any>;
  binary?: Record<string, Buffer | string>;
  error?: Error | string;
}

/**
 * Interface for node execution context
 */
export interface INodeExecutionContext {
  node: any;
  inputData: INodeExecutionData[] | null;
  executionId: string;
  workflowId: string;
  nodeConnections: {
    sources: string[];
    targets: string[];
  } | undefined;
  credentials?: Record<string, any>;
  helpers?: {
    returnJsonArray: (data: any) => INodeExecutionData[];
  };
}

/**
 * Interface for node parameters
 */
export interface INodeParameters {
  [key: string]: any;
}

/**
 * Base Node Class
 * All nodes should extend this class
 */
export abstract class BaseNode {
  /**
   * Node description
   */
  description: {
    name: string;
    type: string;
    displayName: string;
    icon: string;
    category: string;
    description: string;
    inputs: Port[];
    outputs: Port[];
    defaults: {
      name: string;
    };
    version: number;
    properties: {
      [key: string]: {
        displayName: string;
        type: string;
        default?: any;
        description?: string;
        required?: boolean;
        options?: Array<{ name: string; value: any }>;
        placeholder?: string;
        validation?: Array<{ type: string; properties: any }>;
      };
    };
  };

  /**
   * Constructor
   */
  constructor() {
    this.description = {
      name: this.getName(),
      type: this.getType(),
      displayName: this.getDisplayName(),
      icon: this.getIcon(),
      category: this.getCategory(),
      description: this.getDescription(),
      inputs: this.getInputs(),
      outputs: this.getOutputs(),
      defaults: {
        name: this.getName(),
      },
      version: this.getVersion(),
      properties: this.getProperties(),
    };
  }

  /**
   * Get node name
   */
  abstract getName(): string;

  /**
   * Get node type
   */
  abstract getType(): string;

  /**
   * Get display name
   */
  getDisplayName(): string {
    return this.getName();
  }

  /**
   * Get node icon
   */
  abstract getIcon(): string;

  /**
   * Get node category
   */
  abstract getCategory(): string;

  /**
   * Get node description
   */
  abstract getDescription(): string;

  /**
   * Get node inputs
   */
  abstract getInputs(): Port[];

  /**
   * Get node outputs
   */
  abstract getOutputs(): Port[];

  /**
   * Get node version
   */
  getVersion(): number {
    return 1.0;
  }

  /**
   * Get node properties
   */
  abstract getProperties(): {
    [key: string]: {
      displayName: string;
      type: string;
      default?: any;
      description?: string;
      required?: boolean;
      options?: Array<{ name: string; value: any }>;
      placeholder?: string;
      validation?: Array<{ type: string; properties: any }>;
    };
  };

  /**
   * Execute node
   * Must be implemented by all nodes
   */
  abstract execute(context: INodeExecutionContext): Promise<INodeExecutionData[]>;

  /**
   * Convert to NodeType for frontend display
   */
  toNodeType(): NodeType {
    return {
      type: this.getType(),
      name: this.getDisplayName(),
      description: this.getDescription(),
      category: this.getCategory(),
      icon: this.getIcon() as any,
      colorClass: this.getColorClass(),
      inputs: this.getInputs(),
      outputs: this.getOutputs(),
      defaultParameters: this.getDefaultParameters(),
    };
  }

  /**
   * Get color class for node
   */
  getColorClass(): string {
    const categoryColors: Record<string, string> = {
      triggers: "bg-green-600",
      core: "bg-blue-600",
      communication: "bg-purple-600",
      data: "bg-yellow-600",
      utilities: "bg-gray-600",
      ai: "bg-pink-600",
    };

    return categoryColors[this.getCategory()] || "bg-gray-600";
  }

  /**
   * Get default parameters
   */
  getDefaultParameters(): Record<string, string> {
    const properties = this.getProperties();
    const defaults: Record<string, string> = {};

    for (const [key, property] of Object.entries(properties)) {
      if (property.default !== undefined) {
        defaults[key] = typeof property.default === 'object' 
          ? JSON.stringify(property.default)
          : String(property.default);
      }
    }

    return defaults;
  }
}
