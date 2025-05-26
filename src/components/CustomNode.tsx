import { useState } from "react";
import { Settings } from "lucide-react";
import NodeConfigModal from "./NodeConfigModal";
import { Handle, Position, NodeProps } from "reactflow";
import { Node as WorkflowNode } from "../types";
import { renderIcon } from "../data/nodeTypes";
import NodeStatus, { NodeStatusType } from "./NodeStatus";

interface CustomNodeData {
  node: WorkflowNode;
  onParametersChange: (
    nodeId: string,
    parameters: Record<string, string>,
  ) => void;
  status?: NodeStatusType;
  statusMessage?: string;
}

const CustomNode = ({
  data,
  selected,
  isConnectable,
}: NodeProps<CustomNodeData>) => {
  const { node, onParametersChange, status = "idle", statusMessage } = data;
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Check if node has been configured
  const hasConfiguration = Object.keys(node.parameters || {}).length > 0;

  return (
    <>
      <NodeConfigModal
        node={node}
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onSave={(parameters) => {
          onParametersChange(node.id, parameters);
        }}
      />

      <div
        className={`px-3 py-2 rounded-lg shadow-md border ${node.nodeType.colorClass} border-border relative transition-all duration-200 ${
          selected ? "ring-2 ring-primary" : ""
        }`}
      >
        <NodeStatus status={status} message={statusMessage} />
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {renderIcon(node.nodeType.icon)}
            </div>
            <div className="text-sm font-medium">{node.name}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfigModalOpen(true);
            }}
            className="p-1 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center relative"
            title="Configure node"
          >
            <Settings size={14} />
            {hasConfiguration && (
              <span className="absolute w-2 h-2 bg-green-500 rounded-full top-0 right-0"></span>
            )}
          </button>
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
                <span className="ml-2 text-xs text-muted-foreground">
                  {input.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Output ports */}
        {node.outputs.length > 0 && (
          <div className="mt-3 space-y-1">
            {node.outputs.map((output) => (
              <div
                key={output.id}
                className="flex items-center justify-end text-xs"
              >
                <span className="mr-2 text-xs text-muted-foreground">
                  {output.name}
                </span>
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
    </>
  );
};

export default CustomNode;
