// N8n-style Node Registry
import { INodeTypeDescription } from './n8nNodes/BaseNode';

// Import all node implementations
import { ManualTriggerNode, WebhookTriggerNode, ScheduleTriggerNode, EmailTriggerNode } from './n8nNodes/triggers';
import { HttpRequestNode, SetNode, IfNode, CodeNode, MergeNode } from './n8nNodes/core';
import { OpenAIAgentNode, MarketingAgentNode, SalesAgentNode, AgentChainNode } from './n8nNodes/agents';

// Node registry type
export interface INodeRegistry {
  [key: string]: INodeTypeDescription;
}

// Create the node registry following n8n's pattern
export const nodeRegistry: INodeRegistry = {
  // Trigger Nodes
  'Manual Trigger': new ManualTriggerNode().description,
  'Webhook Trigger': new WebhookTriggerNode().description,
  'Schedule Trigger': new ScheduleTriggerNode().description,
  'Email Trigger': new EmailTriggerNode().description,

  // Core Nodes
  'HTTP Request': new HttpRequestNode().description,
  'Set': new SetNode().description,
  'IF': new IfNode().description,
  'Code': new CodeNode().description,
  'Merge': new MergeNode().description,

  // AI Agent Nodes
  'OpenAI Agent': new OpenAIAgentNode().description,
  'Marketing Agent': new MarketingAgentNode().description,
  'Sales Agent': new SalesAgentNode().description,
  'Agent Chain': new AgentChainNode().description,
};

// Node categories for UI organization
export const nodeCategories = [
  {
    id: 'triggers',
    name: '🚀 Triggers',
    description: 'Start your workflows',
    nodes: [
      'Manual Trigger',
      'Webhook Trigger', 
      'Schedule Trigger',
      'Email Trigger'
    ]
  },
  {
    id: 'core',
    name: '⚙️ Core',
    description: 'Essential workflow operations',
    nodes: [
      'HTTP Request',
      'Set',
      'IF',
      'Code',
      'Merge'
    ]
  },
  {
    id: 'ai',
    name: '🤖 AI Agents',
    description: 'AI-powered automation',
    nodes: [
      'OpenAI Agent',
      'Marketing Agent',
      'Sales Agent',
      'Agent Chain'
    ]
  }
];

// Helper functions
export function getNodeDescription(nodeName: string): INodeTypeDescription | undefined {
  return nodeRegistry[nodeName];
}

export function getAllNodeNames(): string[] {
  return Object.keys(nodeRegistry);
}

export function getNodesByCategory(categoryId: string): string[] {
  const category = nodeCategories.find(cat => cat.id === categoryId);
  return category ? category.nodes : [];
}

export function searchNodes(searchTerm: string): string[] {
  const term = searchTerm.toLowerCase();
  return Object.keys(nodeRegistry).filter(nodeName => {
    const description = nodeRegistry[nodeName];
    return (
      nodeName.toLowerCase().includes(term) ||
      description.description.toLowerCase().includes(term) ||
      description.properties.some(prop => 
        prop.displayName.toLowerCase().includes(term) ||
        (prop.description && prop.description.toLowerCase().includes(term))
      )
    );
  });
}

// Create node instance factory
export function createNodeInstance(nodeName: string): any {
  switch (nodeName) {
    // Triggers
    case 'Manual Trigger':
      return new ManualTriggerNode();
    case 'Webhook Trigger':
      return new WebhookTriggerNode();
    case 'Schedule Trigger':
      return new ScheduleTriggerNode();
    case 'Email Trigger':
      return new EmailTriggerNode();

    // Core
    case 'HTTP Request':
      return new HttpRequestNode();
    case 'Set':
      return new SetNode();
    case 'IF':
      return new IfNode();
    case 'Code':
      return new CodeNode();
    case 'Merge':
      return new MergeNode();

    // AI Agents
    case 'OpenAI Agent':
      return new OpenAIAgentNode();
    case 'Marketing Agent':
      return new MarketingAgentNode();
    case 'Sales Agent':
      return new SalesAgentNode();
    case 'Agent Chain':
      return new AgentChainNode();

    default:
      throw new Error(`Unknown node type: ${nodeName}`);
  }
}

// Export for compatibility with existing code
export { nodeRegistry as n8nNodeTypes };
