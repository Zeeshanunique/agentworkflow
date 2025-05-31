import React, { useState, useRef } from 'react';
import { Node, Port, Position } from '../types/workflow';
import { Trash2, Settings } from 'lucide-react';
import { getN8nNodeTypeByType } from '../data/n8nNodeTypes';
import { renderN8nIcon } from '../data/n8nNodeTypes';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (position: Position) => void;
  onPortDragStart: (nodeId: string, portId: string) => void;
  onPortDragEnd: (toNodeId: string, toPortId: string) => void;
  onDelete: () => void;
  onConfigure?: () => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  onSelect,
  onMove,
  onPortDragStart,
  onPortDragEnd,
  onDelete,
  onConfigure
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const nodeStartPos = useRef<Position | null>(null);

  // Get n8n node type for enhanced display
  const n8nNodeType = getN8nNodeTypeByType(node.type);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    nodeStartPos.current = { ...node.position };
  };

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (dragStartPos.current && nodeStartPos.current) {
          const dx = e.clientX - dragStartPos.current.x;
          const dy = e.clientY - dragStartPos.current.y;
          onMove({
            x: nodeStartPos.current.x + dx,
            y: nodeStartPos.current.y + dy
          });
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        dragStartPos.current = null;
        nodeStartPos.current = null;
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, onMove]);

  const renderPort = (port: Port, isOutput: boolean) => {
    const handlePortMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPortDragStart(node.id, port.id);
    };

    const handlePortMouseUp = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPortDragEnd(node.id, port.id);
    };

    return (
      <div
        key={port.id}
        className={cn(
          'absolute w-3 h-3 rounded-full bg-white border-2 border-blue-500 cursor-pointer',
          isOutput ? '-right-1.5' : '-left-1.5',
          'top-1/2 transform -translate-y-1/2'
        )}
        onMouseDown={handlePortMouseDown}
        onMouseUp={handlePortMouseUp}
        title={port.name}
      />
    );
  };

  return (
    <div
      className={cn(
        'absolute p-4 bg-white rounded-lg shadow-lg',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        'border-2',
        isSelected ? 'border-blue-500' : 'border-gray-200'
      )}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        width: '200px'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {n8nNodeType?.icon && (
            <span className="text-blue-600">
              {renderN8nIcon(n8nNodeType.icon)}
            </span>
          )}
          <h3 className="text-sm font-medium truncate">{node.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {onConfigure && (
            <button
              className="p-1 text-gray-500 hover:text-blue-500 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
              title="Configure node"
            >
              <Settings size={14} />
            </button>
          )}
          <button
            className="p-1 text-gray-500 hover:text-red-500 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete node"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {node.inputs.map(input => (
          <div key={input.id} className="relative flex items-center">
            {renderPort(input, false)}
            <span className="text-xs ml-4">{input.name}</span>
          </div>
        ))}

        {node.outputs.map(output => (
          <div key={output.id} className="relative flex items-center justify-end">
            <span className="text-xs mr-4">{output.name}</span>
            {renderPort(output, true)}
          </div>
        ))}
      </div>
    </div>
  );
};
