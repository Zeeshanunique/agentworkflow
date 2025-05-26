import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { Node, Connection, Position } from "../types";
import { getNodeTypeByType } from "../data/nodeTypes";
import { v4 as uuidv4 } from "uuid";
import { NodeStatusType } from "../components/NodeStatus";

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
        }),

      addNode: (nodeType, position) => {
        const nodeId = uuidv4();

        set((state) => {
          const nodeTypeData = getNodeTypeByType(nodeType);
          if (!nodeTypeData) return;

          state.nodes.push({
            id: nodeId,
            name: nodeTypeData.name,
            description: nodeTypeData.description,
            position,
            nodeType: nodeTypeData,
            inputs: nodeTypeData.inputs,
            outputs: nodeTypeData.outputs,
            parameters: nodeTypeData.defaultParameters
              ? { ...nodeTypeData.defaultParameters }
              : {},
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
