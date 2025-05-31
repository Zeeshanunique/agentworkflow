import { Port } from '../types/workflow';
import { LucideIcon, CircleDot, ArrowRight, Code, GitFork, MessageSquare, ShoppingCart, Users, Mail } from 'lucide-react';
import { createElement } from 'react';

export interface NodeType {
  type: string;
  name: string;
  description: string;
  inputs: Port[];
  outputs: Port[];
  icon?: LucideIcon;
  colorClass?: string;
  parameters?: {
    name: string;
    type: string;
    description: string;
    default?: any;
  }[];
}

export const nodeTypes: NodeType[] = [
  {
    type: 'input',
    name: 'Input',
    description: 'Input node for starting the workflow',
    icon: CircleDot,
    colorClass: 'bg-blue-500/20',
    inputs: [],
    outputs: [
      {
        id: 'output',
        name: 'Output',
        type: 'any',
        description: 'Output value'
      }
    ]
  },
  {
    type: 'output',
    name: 'Output',
    description: 'Output node for ending the workflow',
    icon: ArrowRight,
    colorClass: 'bg-green-500/20',
    inputs: [
      {
        id: 'input',
        name: 'Input',
        type: 'any',
        description: 'Input value'
      }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'Function',
    description: 'Execute a JavaScript function',
    icon: Code,
    colorClass: 'bg-purple-500/20',
    inputs: [
      {
        id: 'input',
        name: 'Input',
        type: 'any',
        description: 'Input value'
      }
    ],
    outputs: [
      {
        id: 'output',
        name: 'Output',
        type: 'any',
        description: 'Output value'
      }
    ],
    parameters: [
      {
        name: 'function',
        type: 'string',
        description: 'JavaScript function code',
        default: '(input) => input'
      }
    ]
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Branch based on a condition',
    icon: GitFork,
    colorClass: 'bg-yellow-500/20',
    inputs: [
      {
        id: 'input',
        name: 'Input',
        type: 'any',
        description: 'Input value'
      }
    ],
    outputs: [
      {
        id: 'true',
        name: 'True',
        type: 'any',
        description: 'Output when condition is true'
      },
      {
        id: 'false',
        name: 'False',
        type: 'any',
        description: 'Output when condition is false'
      }
    ],
    parameters: [
      {
        name: 'condition',
        type: 'string',
        description: 'JavaScript condition code',
        default: '(input) => true'
      }
    ]
  },
  {
    type: 'marketing_agent',
    name: 'Marketing Agent',
    description: 'AI agent specialized in marketing tasks',
    icon: Mail,
    colorClass: 'bg-pink-500/20',
    inputs: [
      {
        id: 'input',
        name: 'Input',
        type: 'any',
        description: 'Marketing task or data'
      }
    ],
    outputs: [
      {
        id: 'output',
        name: 'Output',
        type: 'any',
        description: 'Marketing results or content'
      }
    ],
    parameters: [
      {
        name: 'task',
        type: 'string',
        description: 'Marketing task to perform',
        default: 'Generate social media post'
      },
      {
        name: 'style',
        type: 'string',
        description: 'Marketing style or tone',
        default: 'Professional'
      }
    ]
  },
  {
    type: 'sales_agent',
    name: 'Sales Agent',
    description: 'AI agent specialized in sales tasks',
    icon: ShoppingCart,
    colorClass: 'bg-indigo-500/20',
    inputs: [
      {
        id: 'input',
        name: 'Input',
        type: 'any',
        description: 'Sales task or lead data'
      }
    ],
    outputs: [
      {
        id: 'output',
        name: 'Output',
        type: 'any',
        description: 'Sales response or analysis'
      }
    ],
    parameters: [
      {
        name: 'task',
        type: 'string',
        description: 'Sales task to perform',
        default: 'Qualify lead'
      },
      {
        name: 'approach',
        type: 'string',
        description: 'Sales approach to use',
        default: 'Consultative'
      }
    ]
  },
  {
    type: 'customer_service_agent',
    name: 'Customer Service Agent',
    description: 'AI agent specialized in customer support',
    icon: Users,
    colorClass: 'bg-cyan-500/20',
    inputs: [
      {
        id: 'input',
        name: 'Input',
        type: 'any',
        description: 'Customer query or issue'
      }
    ],
    outputs: [
      {
        id: 'output',
        name: 'Output',
        type: 'any',
        description: 'Support response or solution'
      }
    ],
    parameters: [
      {
        name: 'task',
        type: 'string',
        description: 'Support task to perform',
        default: 'Answer customer query'
      },
      {
        name: 'tone',
        type: 'string',
        description: 'Communication tone',
        default: 'Friendly'
      }
    ]
  }
];

export const nodeCategories = [
  {
    id: 'basic',
    name: 'Basic Nodes',
    nodes: [nodeTypes[0], nodeTypes[1]] // Input and Output nodes
  },
  {
    id: 'logic',
    name: 'Logic',
    nodes: [nodeTypes[2], nodeTypes[3]] // Function and Condition nodes
  },
  {
    id: 'agents',
    name: 'AI Agents',
    nodes: [nodeTypes[4], nodeTypes[5], nodeTypes[6]] // Marketing, Sales, and Customer Service agents
  }
];

export function getNodeTypeByType(type: string): NodeType | undefined {
  return nodeTypes.find(nodeType => nodeType.type === type);
}

export function getAllNodeTypes(): NodeType[] {
  return nodeTypes;
}

export function renderIcon(icon?: LucideIcon) {
  if (!icon) return null;
  return createElement(icon, { size: 16 });
} 