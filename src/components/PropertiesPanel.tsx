import React from 'react';
import { Node } from '../types';
import { X } from 'lucide-react';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onClose,
  onUpdateNode
}) => {
  if (!selectedNode) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNode(selectedNode.id, { name: e.target.value });
  };

  const handleParameterChange = (key: string, value: string) => {
    if (!selectedNode.parameters) return;
    
    const updatedParameters = {
      ...selectedNode.parameters,
      [key]: value
    };
    
    onUpdateNode(selectedNode.id, { 
      parameters: updatedParameters 
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Node Properties</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedNode.name}
            onChange={handleNameChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <div className="px-3 py-2 border border-gray-300 bg-gray-50 rounded-md text-gray-500">
            {selectedNode.nodeType.name}
          </div>
        </div>
        
        {selectedNode.parameters && Object.keys(selectedNode.parameters).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Parameters</h3>
            
            {Object.entries(selectedNode.parameters).map(([key, value]) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={value}
                  onChange={(e) => handleParameterChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="pt-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Input Ports</h3>
          {selectedNode.inputs.length === 0 ? (
            <p className="text-sm text-gray-500">No input ports</p>
          ) : (
            <ul className="space-y-1">
              {selectedNode.inputs.map(input => (
                <li key={input.id} className="text-sm flex items-center">
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-indigo-500 mr-2" />
                  <span>{input.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Output Ports</h3>
          {selectedNode.outputs.length === 0 ? (
            <p className="text-sm text-gray-500">No output ports</p>
          ) : (
            <ul className="space-y-1">
              {selectedNode.outputs.map(output => (
                <li key={output.id} className="text-sm flex items-center">
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-indigo-500 mr-2" />
                  <span>{output.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;