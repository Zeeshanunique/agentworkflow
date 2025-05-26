import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Connection as ReactFlowConnection,
  Edge,
  Node as ReactFlowNode,
  ConnectionLineType,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { Node, Connection, Position } from "../types";
import CustomNode from "./CustomNode";
import { NodeStatusType } from "./NodeStatus";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface CanvasProps {
  nodes: Node[];
  connections: Connection[];
  onNodeSelect: (nodeId: string | null) => void;
  onNodeMove: (nodeId: string, position: Position) => void;
  onNodeConnect: (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string,
  ) => void;
  onNodeParametersChange: (
    nodeId: string,
    parameters: Record<string, string>,
  ) => void;
  selectedNodeId: string | null;
  nodeStatuses?: Record<string, { status: NodeStatusType; message?: string }>;
  onNodeDelete?: (nodeId: string) => void;
}

// Define node types
const nodeTypes = {
  customNode: CustomNode,
};

const Canvas: React.FC<CanvasProps> = ({
  nodes,
  connections,
  onNodeSelect,
  onNodeMove,
  onNodeConnect,
  onNodeParametersChange,
  selectedNodeId,
  nodeStatuses = {},
  onNodeDelete,
}) => {
  // Convert our nodes to ReactFlow nodes
  const initialNodes: ReactFlowNode[] = useMemo(() => {
    return nodes.map((node) => {
      const nodeStatus = nodeStatuses[node.id] || { status: "idle" };

      return {
        id: node.id,
        type: "customNode",
        position: node.position,
        data: {
          node,
          onParametersChange: (
            nodeId: string,
            parameters: Record<string, string>,
          ) => {
            onNodeParametersChange(nodeId, parameters);
          },
          status: nodeStatus.status,
          statusMessage: nodeStatus.message,
        },
        selected: node.id === selectedNodeId,
      };
    });
  }, [nodes, selectedNodeId, nodeStatuses, onNodeParametersChange]);

  // Convert our connections to ReactFlow edges
  const initialEdges: Edge[] = useMemo(() => {
    return connections.map((connection) => ({
      id: connection.id,
      source: connection.fromNodeId,
      sourceHandle: connection.fromPortId,
      target: connection.toNodeId,
      targetHandle: connection.toPortId,
      type: "default",
    }));
  }, [connections]);

  // Set up ReactFlow state
  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update ReactFlow nodes when our nodes change
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update ReactFlow edges when our connections change
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle node selection
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  // Handle node movement
  const handleNodeDragStop: NodeMouseHandler = useCallback(
    (_, node) => {
      onNodeMove(node.id, { x: node.position.x, y: node.position.y });
    },
    [onNodeMove],
  );

  // Handle new connections
  const handleConnect = useCallback(
    (params: ReactFlowConnection) => {
      if (
        params.source &&
        params.target &&
        params.sourceHandle &&
        params.targetHandle
      ) {
        onNodeConnect(
          params.source,
          params.sourceHandle,
          params.target,
          params.targetHandle,
        );
      }
    },
    [onNodeConnect],
  );

  // Handle canvas click (deselect nodes)
  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Handle node deletion
  const handleDeleteNode = useCallback(() => {
    if (selectedNodeId && onNodeDelete) {
      onNodeDelete(selectedNodeId);
    }
  }, [selectedNodeId, onNodeDelete]);

  return (
    <div className="w-full h-full bg-background">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel
          position="bottom-right"
          className="bg-background border border-border rounded px-2 py-1 text-xs"
        >
          {reactFlowNodes.length === 0
            ? "No nodes on canvas"
            : selectedNodeId
              ? (() => {
                  const selected = reactFlowNodes.find(
                    (n) => n.id === selectedNodeId,
                  );
                  return selected
                    ? `Selected: ${selected.data.node.name ?? selected.id}`
                    : "No node selected";
                })()
              : "No node selected"}
        </Panel>
        
        {/* Add a delete button that appears when a node is selected */}
        {selectedNodeId && (
          <Panel position="top-right" className="m-2">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteNode} 
              className="flex items-center gap-1"
            >
              <Trash2 size={14} />
              <span>Delete Node</span>
            </Button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default Canvas;
