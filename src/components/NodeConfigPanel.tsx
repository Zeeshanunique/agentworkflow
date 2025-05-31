import React, { useState, useEffect } from 'react';
import { X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Node } from '../types';
import { getN8nNodeTypeByType } from '../data/n8nNodeTypes';
import { getNodeTypeByType } from '../data/nodeTypes';
import { Button } from './ui/button';

interface NodeConfigPanelProps {
  node: Node;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onParametersChange: (parameters: Record<string, any>) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  isVisible,
  position,
  onClose,
  onParametersChange
}) => {
  const [localParameters, setLocalParameters] = useState<Record<string, any>>(node.parameters || {});
  const [isMinimized, setIsMinimized] = useState(false);

  // Get node type information
  const nodeType = getN8nNodeTypeByType(node.type) || getNodeTypeByType(node.type);

  useEffect(() => {
    setLocalParameters(node.parameters || {});
  }, [node.parameters, node.id]);

  if (!isVisible || !nodeType) {
    return null;
  }

  const handleParameterChange = (key: string, value: any) => {
    setLocalParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    onParametersChange(localParameters);
  };

  const renderParameterInput = (key: string, value: any, defaultValue: any = '') => {
    const currentValue = value !== undefined ? value : defaultValue;

    // Handle different parameter types
    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
      return (
        <input
          type="password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={currentValue}
          onChange={(e) => handleParameterChange(key, e.target.value)}
          placeholder={`Enter ${key}`}
        />
      );
    }

    if (key.toLowerCase().includes('model') && (key.toLowerCase().includes('gpt') || node.type === 'openai')) {
      return (
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={currentValue}
          onChange={(e) => handleParameterChange(key, e.target.value)}
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      );
    }

    if (key.toLowerCase().includes('method') && key.toLowerCase().includes('http')) {
      return (
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={currentValue}
          onChange={(e) => handleParameterChange(key, e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      );
    }

    if (key.toLowerCase().includes('operation')) {
      return (
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={currentValue}
          onChange={(e) => handleParameterChange(key, e.target.value)}
        >
          <option value="create">Create</option>
          <option value="read">Read</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="list">List</option>
          <option value="search">Search</option>
        </select>
      );
    }

    if (typeof currentValue === 'boolean') {
      return (
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          checked={currentValue}
          onChange={(e) => handleParameterChange(key, e.target.checked)}
        />
      );
    }

    if (typeof currentValue === 'number' || key.toLowerCase().includes('port') || key.toLowerCase().includes('timeout')) {
      return (
        <input
          type="number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={currentValue}
          onChange={(e) => handleParameterChange(key, parseFloat(e.target.value) || 0)}
          placeholder={`Enter ${key}`}
        />
      );
    }

    if (key.toLowerCase().includes('query') || key.toLowerCase().includes('code') || key.toLowerCase().includes('prompt')) {
      return (
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          value={currentValue}
          onChange={(e) => handleParameterChange(key, e.target.value)}
          placeholder={`Enter ${key}`}
        />
      );
    }

    return (
      <input
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={currentValue}
        onChange={(e) => handleParameterChange(key, e.target.value)}
        placeholder={`Enter ${key}`}
      />
    );
  };

  const formatParameterLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  };

  // Get all available parameters (from defaultParameters and current parameters)
  const defaultParams = (nodeType as any).defaultParameters || {};
  const allParameters = { ...defaultParams, ...localParameters };

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md"
      style={{
        left: position.x,
        top: position.y - (isMinimized ? 50 : 400), // Position above the node
        minWidth: '320px',
        maxHeight: isMinimized ? '60px' : '400px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${nodeType.colorClass || 'bg-gray-500'}`}
          />          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {node.data?.name || nodeType.name} Configuration
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7 p-0"
          >
            {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="space-y-4">
            {Object.keys(allParameters).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No configuration parameters available for this node.
              </p>
            ) : (
              Object.entries(allParameters).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">
                    {formatParameterLabel(key)}
                  </label>
                  {renderParameterInput(key, localParameters[key], value)}
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          {Object.keys(allParameters).length > 0 && (
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="flex items-center gap-1">
                <Save size={12} />
                Save
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NodeConfigPanel;
