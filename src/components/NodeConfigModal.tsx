import React from 'react';
import { Node } from '../types/workflow';

interface NodeConfigModalProps {
  node: Node;
  onClose: () => void;
  onParametersChange: (parameters: Record<string, any>) => void;
}

const NodeConfigModal: React.FC<NodeConfigModalProps> = ({
  node,
  onClose,
  onParametersChange
}) => {
  const handleParameterChange = (key: string, value: any) => {
    onParametersChange({
      ...node.parameters,
      [key]: value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{node.name} Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {node.type === 'openai' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={node.parameters?.apiKey || ''}
                  onChange={(e) => handleParameterChange('apiKey', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={node.parameters?.model || 'gpt-3.5-turbo'}
                  onChange={(e) => handleParameterChange('model', e.target.value)}
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
              </div>
            </>
          )}

          {/* Add more node type specific configurations here */}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigModal;
