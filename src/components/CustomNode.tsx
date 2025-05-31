import { useState } from "react";
import { Settings } from "lucide-react";
import NodeConfigModal from "./NodeConfigModal";
import { Handle, Position, NodeProps } from "reactflow";
import { Node as WorkflowNode } from "../types/workflow";
import { renderN8nIcon, getN8nNodeTypeByType } from "../data/n8nNodeTypes";
import NodeStatus, { NodeStatusType } from "./NodeStatus";

interface CustomNodeData {
  node: WorkflowNode;
  onParametersChange: (
    nodeId: string,
    parameters: Record<string, any>,
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

  // Get node type information
  const nodeType = getN8nNodeTypeByType(node.type);
  if (!nodeType) {
    return <div>Invalid node type</div>;
  }

  const inputs = nodeType.inputs;
  const outputs = nodeType.outputs;
  const colorClass = nodeType.colorClass || 'bg-gray-600';
  const icon = nodeType.icon;

  // Check if node has been configured
  const hasConfiguration = Object.keys(node.parameters || {}).length > 0;

  return (
    <>
      {configModalOpen && (
        <NodeConfigModal
          node={node}
          onClose={() => setConfigModalOpen(false)}
          onParametersChange={(parameters: Record<string, any>) => {
            onParametersChange(node.id, parameters);
          }}
        />
      )}

      <div
        className={`px-3 py-2 rounded-lg shadow-md border ${colorClass} border-border relative transition-all duration-200 ${
          selected ? "ring-2 ring-primary" : ""
        }`}
      >
        <NodeStatus status={status} message={statusMessage} />
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {icon ? renderN8nIcon(icon) : null}
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
        {inputs.length > 0 && (
          <div className="mt-3 space-y-1">
            {inputs.map((input) => (
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
        {outputs.length > 0 && (
          <div className="mt-3 space-y-1">
            {outputs.map((output) => (
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
