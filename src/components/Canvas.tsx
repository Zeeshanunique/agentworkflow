import React, { useState } from 'react';
import { Node, Edge, Position } from '../types/workflow';
import { NodeComponent } from './NodeComponent';
import Connections from './Connections';

interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeMove: (nodeId: string, position: Position) => void;
  onNodeDelete: (nodeId: string) => void;
  onEdgeCreate: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  nodes,
  edges,
  onNodeMove,
  onNodeDelete,
  onEdgeCreate
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedPort, setDraggedPort] = useState<{ nodeId: string; portId: string } | null>(null);

  const onPortDragStart = (nodeId: string, portId: string) => {
    setDraggedPort({ nodeId, portId });
  };

  const onPortDragEnd = (toNodeId: string, toPortId: string) => {
    if (draggedPort) {
      onEdgeCreate(draggedPort.nodeId, draggedPort.portId, toNodeId, toPortId);
      setDraggedPort(null);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-100">
      <Connections nodes={nodes} edges={edges} />
      
      {nodes.map((node) => (
        <NodeComponent
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          onSelect={() => setSelectedNodeId(node.id)}
          onMove={(position: Position) => onNodeMove(node.id, position)}
          onPortDragStart={onPortDragStart}
          onPortDragEnd={onPortDragEnd}
          onDelete={() => onNodeDelete(node.id)}
        />
      ))}
    </div>
  );
};

export default Canvas;
