import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { Node, Connection, Position, NodeType } from "../types";
import type { INode, IConnections, IWorkflowBase } from "../types/n8n";
import { getN8nNodeTypeByType } from "../data/n8nNodeTypes";
import { getNodeDescription } from "../data/n8nNodeRegistry";
import { v4 as uuidv4 } from "uuid";
import { NodeStatusType } from "../components/NodeStatus";

// Helper function to get color class for node group
function getColorClassForGroup(group: string): string {
  switch (group) {
    case 'trigger':
      return 'bg-green-600';
    case 'core':
      return 'bg-blue-600';
    case 'ai':
      return 'bg-purple-600';
    case 'communication':
      return 'bg-cyan-600';
    case 'database':
      return 'bg-yellow-600';
    case 'utility':
      return 'bg-gray-600';
    default:
      return 'bg-gray-500';
  }
}

interface WorkflowState {
  // Workflow data
  id: string | null;
  name: string;
  description: string;
  nodes: Node[];
  connections: Connection[];
  isPublic: boolean;

  // UI state
  selectedNodeId: string | null;
  isRunning: boolean;
  isSaving: boolean;
  lastSaved: Date | null;

  // Node execution state
  nodeStatuses: Record<string, { status: NodeStatusType; message?: string }>;

  // Authentication state
  user: {
    id: number;
    username: string;
    email: string;
  } | null;
  isAuthenticated: boolean;

  // Actions
  setWorkflow: (workflow: {
    id: string;
    name: string;
    description?: string;
    nodes: Node[];
    connections: Connection[];
    isPublic?: boolean;
  }) => void;

  addNode: (nodeType: string, position: Position) => string;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, position: Position) => void;
  selectNode: (nodeId: string | null) => void;

  addConnection: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string,
  ) => void;
  deleteConnection: (connectionId: string) => void;

  setUser: (
    user: { id: number; username: string; email: string } | null,
  ) => void;

  startRunning: () => void;
  stopRunning: () => void;

  setNodeStatus: (
    nodeId: string,
    status: NodeStatusType,
    message?: string,
  ) => void;
  resetNodeStatuses: () => void;

  updateWorkflowMeta: (data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }) => void;
  newWorkflow: () => void;

  // N8n conversion methods
  toN8nWorkflow: () => IWorkflowBase;
  fromN8nWorkflow: (workflow: IWorkflowBase) => void;
  toN8nNode: (node: Node) => INode;
  fromN8nNode: (n8nNode: INode) => Node;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    immer((set) => ({
      // Initial state
      id: null,
      name: "New Workflow",
      description: "",
      nodes: [],
      connections: [],
      isPublic: false,

      selectedNodeId: null,
      isRunning: false,
      isSaving: false,
      lastSaved: null,
      nodeStatuses: {},

      user: null,
      isAuthenticated: false,

      // Actions
      setWorkflow: (workflow) =>
        set((state) => {
          state.id = workflow.id;
          state.name = workflow.name;
          state.description = workflow.description || "";
          state.nodes = workflow.nodes;
          state.connections = workflow.connections;
          state.isPublic = workflow.isPublic || false;
          state.selectedNodeId = null;
          state.lastSaved = new Date();
        }),      addNode: (nodeType, position) => {
        const nodeId = uuidv4();

        set((state) => {
          // Try to get node type from n8n registry first
          const n8nNodeDescription = getNodeDescription(nodeType);
          const legacyNodeType = getN8nNodeTypeByType(nodeType);
          
          if (!n8nNodeDescription && !legacyNodeType) {
            console.error(`Node type '${nodeType}' not found in n8n registry`);
            return;
          }

          // Use n8n description if available, otherwise convert legacy type
          let nodeTypeData: NodeType;
          let defaultParameters: Record<string, any> = {};

          if (n8nNodeDescription) {
            // Extract parameters from n8n node description
            defaultParameters = n8nNodeDescription.properties.reduce((acc: any, prop: any) => {
              acc[prop.name] = prop.default || '';
              return acc;
            }, {});

            // Convert n8n description to NodeType format
            nodeTypeData = {
              type: n8nNodeDescription.name,
              name: n8nNodeDescription.displayName,
              description: n8nNodeDescription.description,
              category: n8nNodeDescription.group?.[0] || 'general',
              icon: (n8nNodeDescription as any).icon || 'settings' as any,
              colorClass: getColorClassForGroup(n8nNodeDescription.group?.[0] || 'general'),
              inputs: Array.isArray(n8nNodeDescription.inputs) 
                ? n8nNodeDescription.inputs.map((input: any) => ({
                    id: typeof input === 'string' ? input : input.displayName.toLowerCase(),
                    name: typeof input === 'string' ? input.charAt(0).toUpperCase() + input.slice(1) : input.displayName,
                    type: typeof input === 'string' ? 'any' : input.type
                  })) 
                : [],
              outputs: Array.isArray(n8nNodeDescription.outputs)
                ? n8nNodeDescription.outputs.map((output: any) => ({
                    id: typeof output === 'string' ? output : output.displayName.toLowerCase(),
                    name: typeof output === 'string' ? output.charAt(0).toUpperCase() + output.slice(1) : output.displayName,
                    type: typeof output === 'string' ? 'any' : output.type
                  }))
                : [],
              defaultParameters
            };
          } else if (legacyNodeType) {
            // Fallback to legacy node type if available
            nodeTypeData = {
              type: legacyNodeType.type,
              name: legacyNodeType.name,
              description: legacyNodeType.description,
              category: (legacyNodeType as any).category || 'general',
              icon: legacyNodeType.icon || 'settings' as any,
              colorClass: (legacyNodeType as any).colorClass || 'bg-gray-500/20',
              inputs: legacyNodeType.inputs,
              outputs: legacyNodeType.outputs,
              defaultParameters: (legacyNodeType as any).defaultParameters ||
                ((legacyNodeType as any).parameters?.reduce((acc: any, param: any) => {
                  acc[param.name] = param.default || '';
                  return acc;
                }, {} as Record<string, string>)) || {}
            };
          } else {
            // This should never happen due to the check above, but adding for safety
            return;
          }

          state.nodes.push({
            id: nodeId,
            type: nodeTypeData.type,
            position,
            parameters: nodeTypeData.defaultParameters,
            data: {
              name: nodeTypeData.name,
              description: nodeTypeData.description,
              nodeType: nodeTypeData,
              inputs: nodeTypeData.inputs,
              outputs: nodeTypeData.outputs,
            },
          });

          state.selectedNodeId = nodeId;
        });

        return nodeId;
      },

      updateNode: (nodeId, updates) =>
        set((state) => {
          const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);
          if (nodeIndex >= 0) {
            state.nodes[nodeIndex] = { ...state.nodes[nodeIndex], ...updates };
          }
        }),

      deleteNode: (nodeId) =>
        set((state) => {
          // Remove all connections involving this node
          state.connections = state.connections.filter(
            (conn) => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId,
          );

          // Remove the node
          state.nodes = state.nodes.filter((node) => node.id !== nodeId);

          // Clear selection if this node was selected
          if (state.selectedNodeId === nodeId) {
            state.selectedNodeId = null;
          }
        }),

      moveNode: (nodeId, position) =>
        set((state) => {
          const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);
          if (nodeIndex >= 0) {
            state.nodes[nodeIndex].position = position;
          }
        }),

      selectNode: (nodeId) =>
        set((state) => {
          state.selectedNodeId = nodeId;
        }),

      addConnection: (fromNodeId, fromPortId, toNodeId, toPortId) =>
        set((state) => {
          // Check if connection already exists
          const exists = state.connections.some(
            (conn) =>
              conn.fromNodeId === fromNodeId &&
              conn.fromPortId === fromPortId &&
              conn.toNodeId === toNodeId &&
              conn.toPortId === toPortId,
          );

          if (!exists) {
            state.connections.push({
              id: uuidv4(),
              fromNodeId,
              fromPortId,
              toNodeId,
              toPortId,
            });
          }
        }),

      deleteConnection: (connectionId) =>
        set((state) => {
          state.connections = state.connections.filter(
            (conn) => conn.id !== connectionId,
          );
        }),

      setUser: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        }),

      startRunning: () =>
        set((state) => {
          state.isRunning = true;
        }),

      stopRunning: () =>
        set((state) => {
          state.isRunning = false;
        }),

      setNodeStatus: (nodeId, status, message) =>
        set((state) => {
          state.nodeStatuses[nodeId] = { status, message };
        }),

      resetNodeStatuses: () =>
        set((state) => {
          state.nodeStatuses = {};
        }),

      updateWorkflowMeta: (data) =>
        set((state) => {
          if (data.name !== undefined) state.name = data.name;
          if (data.description !== undefined)
            state.description = data.description;
          if (data.isPublic !== undefined) state.isPublic = data.isPublic;
        }),

      newWorkflow: () =>
        set((state) => {
          state.id = null;
          state.name = "New Workflow";
          state.description = "";
          state.nodes = [];
          state.connections = [];
          state.isPublic = false;
          state.selectedNodeId = null;
          state.lastSaved = null;
        }),

      // N8n conversion methods
      toN8nWorkflow: (): IWorkflowBase => {
        const { id, name, nodes, connections } = useWorkflowStore.getState();
        
        // Convert nodes to n8n format
        const n8nNodes: INode[] = nodes.map(node => ({
          id: node.id,
          name: node.data?.name || node.type,
          type: node.type,
          typeVersion: node.typeVersion || 1,
          position: [node.position.x, node.position.y],
          parameters: node.parameters || {},
          disabled: node.disabled || false,
          notes: node.notes || '',
          credentials: node.credentials || {},
          webhookId: node.webhookId,
          continueOnFail: node.continueOnFail || false,
          retryOnFail: node.retryOnFail || false,
          maxTries: node.maxTries || 3,
          waitBetweenTries: node.waitBetweenTries || 1000
        }));

        // Convert connections to n8n format
        const n8nConnections: IConnections = {};
        connections.forEach(conn => {
          if (!n8nConnections[conn.fromNodeId]) {
            n8nConnections[conn.fromNodeId] = {};
          }
          if (!n8nConnections[conn.fromNodeId][conn.fromPortId]) {
            n8nConnections[conn.fromNodeId][conn.fromPortId] = [];
          }
          
          n8nConnections[conn.fromNodeId][conn.fromPortId].push({
            node: conn.toNodeId,
            type: conn.toPortId,
            index: 0
          });
        });

        return {
          id: id || undefined,
          name,
          nodes: n8nNodes,
          connections: n8nConnections,
          active: true,
          settings: {
            saveDataErrorExecution: 'all',
            saveDataSuccessExecution: 'all',
            saveManualExecutions: true,
            timezone: 'UTC'
          }
        };
      },

      fromN8nWorkflow: (workflow: IWorkflowBase) => 
        set((state) => {
          state.id = workflow.id || null;
          state.name = workflow.name;
          state.description = '';

          // Convert n8n nodes to our format
          state.nodes = workflow.nodes.map(n8nNode => {
            const n8nNodeType = getN8nNodeTypeByType(n8nNode.type);
            
            // Use n8n node type if available
            const nodeTypeData = n8nNodeType || {
              type: n8nNode.type,
              name: n8nNode.type,
              description: '',
              category: 'general',
              icon: 'settings' as any,
              colorClass: 'bg-gray-500',
              inputs: [],
              outputs: [],
              defaultParameters: {}
            };
            
            return {
              id: n8nNode.id,
              type: n8nNode.type,
              position: { x: n8nNode.position[0], y: n8nNode.position[1] },
              parameters: n8nNode.parameters,
              data: {
                name: n8nNode.name,
                description: nodeTypeData?.description || '',
                nodeType: nodeTypeData,
                inputs: nodeTypeData?.inputs || [],
                outputs: nodeTypeData?.outputs || []
              },
              typeVersion: n8nNode.typeVersion,
              disabled: n8nNode.disabled,
              notes: n8nNode.notes,
              credentials: n8nNode.credentials,
              webhookId: n8nNode.webhookId,
              continueOnFail: n8nNode.continueOnFail,
              retryOnFail: n8nNode.retryOnFail,
              maxTries: n8nNode.maxTries,
              waitBetweenTries: n8nNode.waitBetweenTries,
              name: n8nNode.name
            };
          });

          // Convert n8n connections to our format
          state.connections = [];
          Object.keys(workflow.connections).forEach(fromNodeId => {
            Object.keys(workflow.connections[fromNodeId]).forEach(fromPortId => {
              workflow.connections[fromNodeId][fromPortId].forEach(connection => {
                state.connections.push({
                  id: uuidv4(),
                  fromNodeId,
                  fromPortId,
                  toNodeId: connection.node,
                  toPortId: connection.type
                });
              });
            });
          });

          state.selectedNodeId = null;
          state.lastSaved = new Date();
        }),

      toN8nNode: (node: Node): INode => ({
        id: node.id,
        name: node.data?.name || node.type,
        type: node.type,
        typeVersion: node.typeVersion || 1,
        position: [node.position.x, node.position.y],
        parameters: node.parameters || {},
        disabled: node.disabled || false,
        notes: node.notes || '',
        credentials: node.credentials || {},
        webhookId: node.webhookId,
        continueOnFail: node.continueOnFail || false,
        retryOnFail: node.retryOnFail || false,
        maxTries: node.maxTries || 3,
        waitBetweenTries: node.waitBetweenTries || 1000
      }),

      fromN8nNode: (n8nNode: INode): Node => {
        const n8nNodeType = getN8nNodeTypeByType(n8nNode.type);
        
        // Use n8n node type 
        const nodeTypeData = n8nNodeType || {
          type: n8nNode.type,
          name: n8nNode.type,
          description: '',
          category: 'general',
          icon: 'settings' as any,
          colorClass: 'bg-gray-500',
          inputs: [],
          outputs: [],
          defaultParameters: {}
        };
        
        return {
          id: n8nNode.id,
          type: n8nNode.type,
          position: { x: n8nNode.position[0], y: n8nNode.position[1] },
          parameters: n8nNode.parameters,
          data: {
            name: n8nNode.name,
            description: nodeTypeData?.description || '',
            nodeType: nodeTypeData,
            inputs: nodeTypeData?.inputs || [],
            outputs: nodeTypeData?.outputs || []
          },
          typeVersion: n8nNode.typeVersion,
          disabled: n8nNode.disabled,
          notes: n8nNode.notes,
          credentials: n8nNode.credentials,
          webhookId: n8nNode.webhookId,
          continueOnFail: n8nNode.continueOnFail,
          retryOnFail: n8nNode.retryOnFail,
          maxTries: n8nNode.maxTries,
          waitBetweenTries: n8nNode.waitBetweenTries,
          name: n8nNode.name,
          inputs: nodeTypeData?.inputs || [],
          outputs: nodeTypeData?.outputs || []
        };
      },

    })),
    {
      name: "workflow-storage",
      partialize: (state) => ({
        id: state.id,
        name: state.name,
        description: state.description,
        nodes: state.nodes,
        connections: state.connections,
        isPublic: state.isPublic,
      }),
    },
  ),
);
