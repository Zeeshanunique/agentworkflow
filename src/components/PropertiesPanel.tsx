// filepath: /workspaces/agentworkflow/src/components/PropertiesPanel.tsx
import React from "react";
import { Node, Port } from "../types/workflow";

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onNodeUpdate: (node: Partial<Node>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onNodeUpdate,
}) => {
  if (!selectedNode) {
    return (
      <div className="w-64 bg-white border-l p-4">
        <p className="text-gray-500">Select a node to view properties</p>
      </div>
    );
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNodeUpdate({
      ...selectedNode,
      name: e.target.value,
    });
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...selectedNode.inputs];
    newInputs[index] = { ...newInputs[index], name: value };
    onNodeUpdate({
      ...selectedNode,
      inputs: newInputs,
    });
  };

  const handleOutputChange = (index: number, value: string) => {
    const newOutputs = [...selectedNode.outputs];
    newOutputs[index] = { ...newOutputs[index], name: value };
    onNodeUpdate({
      ...selectedNode,
      outputs: newOutputs,
    });
  };

  return (
    <div className="w-64 bg-white border-l p-4">
      <h3 className="text-lg font-semibold mb-4">Properties</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={selectedNode.name}
            onChange={handleNameChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Inputs</label>
          <div className="space-y-2">
            {selectedNode.inputs.map((input: Port, index: number) => (
              <input
                key={input.id}
                type="text"
                value={input.name}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Outputs</label>
          <div className="space-y-2">
            {selectedNode.outputs.map((output: Port, index: number) => (
              <input
                key={output.id}
                type="text"
                value={output.name}
                onChange={(e) => handleOutputChange(index, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
