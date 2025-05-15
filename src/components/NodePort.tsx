import React from 'react';

interface NodePortProps {
  nodeId: string;
  portId: string;
  type: 'input' | 'output';
  onDragStart: (nodeId: string, portId: string) => void;
  onDragEnd: (toNodeId: string, toPortId: string) => void;
}

const NodePort: React.FC<NodePortProps> = ({
  nodeId,
  portId,
  type,
  onDragStart,
  onDragEnd
}) => {
  const isInput = type === 'input';
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInput) {
      onDragStart(nodeId, portId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isInput) {
      e.preventDefault();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isInput) {
      e.preventDefault();
      const fromNodeId = e.dataTransfer.getData('fromNodeId');
      const fromPortId = e.dataTransfer.getData('fromPortId');
      
      if (fromNodeId && fromPortId) {
        onDragEnd(nodeId, portId);
      }
    }
  };

  return (
    <div
      className={`w-3 h-3 rounded-full bg-white border-2 border-indigo-500 hover:bg-indigo-200 transition-colors cursor-pointer`}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      draggable={!isInput}
      onDragStart={(e) => {
        if (!isInput) {
          e.dataTransfer.setData('fromNodeId', nodeId);
          e.dataTransfer.setData('fromPortId', portId);
        }
      }}
    />
  );
};

export default NodePort;