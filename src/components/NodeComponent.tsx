import React, { useState } from 'react';
import { Node, Position } from '../types';
import NodePort from './NodePort';
import { Trash2 } from 'lucide-react';

interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (position: Position) => void;
  onPortDragStart: (nodeId: string, portId: string) => void;
  onPortDragEnd: (nodeId: string, portId: string) => void;
  onDelete: (nodeId: string) => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  onSelect,
  onMove,
  onPortDragStart,
  onPortDragEnd,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onMove({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const nodeWidth = 240;
  const headerHeight = 40;

  return (
    <div
      className={`absolute rounded-md shadow-md transition-shadow ${
        isSelected ? 'shadow-lg ring-2 ring-indigo-500' : ''
      }`}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        width: `${nodeWidth}px`,
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`rounded-t-md px-3 py-2 cursor-move ${node.nodeType.colorClass} relative group`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 mr-2 flex items-center justify-center">
              {node.nodeType.icon}
            </div>
            <div className="font-medium text-white">{node.name}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500 rounded"
          >
            <Trash2 size={16} className="text-white" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-b-md border border-gray-200 border-t-0 p-3">
        <div className="absolute left-0 top-0 h-full flex flex-col justify-evenly">
          {node.inputs.map((input, index) => (
            <div key={input.id} className="flex items-center -ml-3">
              <NodePort 
                nodeId={node.id}
                portId={input.id}
                type="input"
                onDragStart={() => {}}
                onDragEnd={(toNodeId, toPortId) => onPortDragEnd(toNodeId, toPortId)}
              />
              <span className="text-xs ml-1 text-gray-500">{input.name}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-2 min-h-[60px]">
          <p className="text-xs text-gray-500">{node.description}</p>
          {node.nodeType.type === 'openai_key' && (
            <input
              type="password"
              className="mt-2 w-full px-2 py-1 text-sm border rounded"
              placeholder="Enter OpenAI API Key"
              value={node.parameters?.apiKey || ''}
              onChange={(e) => {
                node.parameters = { ...node.parameters, apiKey: e.target.value };
              }}
            />
          )}
        </div>

        <div className="absolute right-0 top-0 h-full flex flex-col justify-evenly">
          {node.outputs.map((output, index) => (
            <div key={output.id} className="flex items-center -mr-3">
              <span className="text-xs mr-1 text-gray-500">{output.name}</span>
              <NodePort 
                nodeId={node.id}
                portId={output.id}
                type="output"
                onDragStart={(nodeId, portId) => onPortDragStart(nodeId, portId)}
                onDragEnd={() => {}}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NodeComponent;