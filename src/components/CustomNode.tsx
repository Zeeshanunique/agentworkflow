import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Node as WorkflowNode } from '../types';

interface CustomNodeData {
  node: WorkflowNode;
}

const CustomNode = ({ 
  id, 
  data,
  selected,
  isConnectable
}: NodeProps<CustomNodeData>) => {
  const { node } = data;

  return (
    <div
      className={`px-4 py-2 rounded-md shadow-md border border-border transition-all duration-200 ${
        selected ? 'ring-2 ring-primary' : ''
      } ${node.nodeType.colorClass}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          {node.nodeType.icon}
        </div>
        <div className="text-sm font-medium">{node.name}</div>
      </div>

      {/* Input ports */}
      {node.inputs.length > 0 && (
        <div className="mt-3 space-y-1">
          {node.inputs.map((input) => (
            <div key={input.id} className="flex items-center text-xs">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-gray-600"
              />
              <span className="ml-2 text-xs text-muted-foreground">{input.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output ports */}
      {node.outputs.length > 0 && (
        <div className="mt-3 space-y-1">
          {node.outputs.map((output) => (
            <div key={output.id} className="flex items-center justify-end text-xs">
              <span className="mr-2 text-xs text-muted-foreground">{output.name}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                isConnectable={isConnectable}
                className="w-2 h-2 bg-gray-400 border-gray-600"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(CustomNode);
