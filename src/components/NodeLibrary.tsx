import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { NodeCategory } from '../types';

interface NodeLibraryProps {
  categories: NodeCategory[];
  onNodeAdd: (nodeType: string) => void;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ categories, onNodeAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories.map(cat => cat.id)
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    nodes: category.nodes.filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search nodes..."
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {filteredCategories.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No nodes found.</p>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="mb-4">
              <button
                className="flex items-center justify-between w-full text-left px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded"
                onClick={() => toggleCategory(category.id)}
              >
                <span className="font-medium text-gray-700">{category.name}</span>
                <span className="text-gray-400">{expandedCategories.includes(category.id) ? '−' : '+'}</span>
              </button>
              
              {expandedCategories.includes(category.id) && (
                <div className="mt-2 space-y-2 pl-2">
                  {category.nodes.map((node) => (
                    <div
                      key={node.type}
                      className="p-2 rounded border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-grab transition-colors"
                      onClick={() => onNodeAdd(node.type)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('nodeType', node.type);
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded flex items-center justify-center mr-2 ${node.colorClass}`}>
                          {node.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{node.name}</h4>
                          <p className="text-xs text-gray-500">{node.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NodeLibrary;