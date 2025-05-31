import { useState } from "react";
import { Settings, AlertTriangle, CheckCircle, Clock, HelpCircle } from "lucide-react";
import NodeConfigModal from "./NodeConfigModal";
import { Handle, Position, NodeProps } from "reactflow";
import { Node as WorkflowNode } from "../types/workflow";
import { renderN8nIcon, getN8nNodeTypeByType } from "../data/n8nNodeTypes";
import { ReactNode } from "react";
import { NodeStatusType } from "./NodeStatus";
import { NodeIconType } from "../types";

interface CustomNodeData {
  node: WorkflowNode;
  onParametersChange: (
    nodeId: string,
    parameters: Record<string, any>,
  ) => void;
  onConfigPanelOpen: (nodeId: string, position: { x: number; y: number }) => void;
  status?: NodeStatusType;
  statusMessage?: string;
}

const CustomNode = ({
  data,
  selected,
  isConnectable,
}: NodeProps<CustomNodeData>) => {
  const { node, onParametersChange, onConfigPanelOpen, status = "idle", statusMessage } = data;
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Get node type information from n8n types
  const nodeType = getN8nNodeTypeByType(node.type);
  if (!nodeType) {
    return (
      <div className="px-3 py-2 rounded-lg shadow-md border border-red-500 bg-red-50">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-sm font-medium text-red-700">Invalid Node</span>
        </div>
        <p className="text-xs text-red-600 mt-1">Type: {node.type}</p>
      </div>
    );
  }

  const inputs = nodeType.inputs || [];
  const outputs = nodeType.outputs || [];
  const colorClass = nodeType.colorClass || 'bg-gray-600';
  // Get icon from node type with proper typing for function
  const icon = nodeType.icon || null;
  // Check if icon is a function that can be called
  const isIconFunction = typeof icon === 'function';

  // Check if node has been configured
  const hasConfiguration = Object.keys(node.parameters || {}).length > 0;
  
  // Check if node is properly configured (has required parameters)
  const isProperlyConfigured = hasConfiguration; // You can add more sophisticated validation here

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle size={12} className="text-green-500" />;
      case "error":
        return <AlertTriangle size={12} className="text-red-500" />;
      case "running":
        return <Clock size={12} className="text-blue-500 animate-pulse" />;
      case "idle":
      default:
        return isProperlyConfigured ? null : <HelpCircle size={12} className="text-yellow-500" />;
    }
  };

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
          selected ? "ring-2 ring-primary shadow-lg" : ""
        } ${status === "running" ? "animate-pulse" : ""}`}
        style={{ minWidth: "180px" }}
      >
        {/* Node Status Indicator */}
        <div className="absolute -top-1 -right-1 z-10">
          {getStatusIcon()}
        </div>

        {/* Node Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {icon ? (
                isIconFunction ? 
                  (icon as (props: any) => ReactNode)({ size: 16 }) : 
                  renderN8nIcon(icon as NodeIconType)
              ) : null}
            </div>
            <div className="text-sm font-medium text-white truncate" title={node.name}>
              {node.name}
            </div>
          </div>
          
          {/* Configuration Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Get the node element position for config panel positioning
              const nodeElement = e.currentTarget.closest('.react-flow__node');
              if (nodeElement && onConfigPanelOpen) {
                const rect = nodeElement.getBoundingClientRect();
                onConfigPanelOpen(node.id, {
                  x: rect.right + 10,
                  y: rect.top
                });
              } else {
                // Fallback to modal if positioning fails
                setConfigModalOpen(true);
              }
            }}
            className="p-1 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center relative flex-shrink-0"
            title="Configure node"
          >
            <Settings size={14} className="text-white/80" />
            {hasConfiguration && (
              <span className="absolute w-2 h-2 bg-green-500 rounded-full -top-0.5 -right-0.5 border border-white"></span>
            )}
            {!isProperlyConfigured && (
              <span className="absolute w-2 h-2 bg-yellow-500 rounded-full -top-0.5 -right-0.5 border border-white animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Node Description */}
        {nodeType.description && (
          <div className="text-xs text-white/70 mb-2 truncate" title={nodeType.description}>
            {nodeType.description}
          </div>
        )}

        {/* Input ports */}
        {inputs.length > 0 && (
          <div className="mt-2 space-y-1">
            {inputs.map((input, index) => (
              <div key={input.id} className="flex items-center text-xs relative">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={input.id}
                  isConnectable={isConnectable}
                  className="w-3 h-3 bg-white border-2 border-gray-600 hover:border-blue-500 transition-colors"
                  style={{ left: -6, top: 2 + index * 20 }}
                />
                <span className="ml-2 text-white/70 truncate" title={input.name}>
                  {input.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Output ports */}
        {outputs.length > 0 && (
          <div className="mt-2 space-y-1">
            {outputs.map((output, index) => (
              <div
                key={output.id}
                className="flex items-center justify-end text-xs relative"
              >
                <span className="mr-2 text-white/70 truncate" title={output.name}>
                  {output.name}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={output.id}
                  isConnectable={isConnectable}
                  className="w-3 h-3 bg-white border-2 border-gray-600 hover:border-blue-500 transition-colors"
                  style={{ right: -6, top: 2 + index * 20 }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Error indicator */}
        {status === "error" && statusMessage && (
          <div className="mt-2 p-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-200">
            <div className="flex items-center gap-1">
              <AlertTriangle size={10} />
              <span className="truncate" title={statusMessage}>
                {statusMessage}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomNode;
