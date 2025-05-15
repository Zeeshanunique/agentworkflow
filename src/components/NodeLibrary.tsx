// filepath: /workspaces/agentworkflow/src/components/NodeLibrary.tsx
import React, { useState } from 'react';
import { NodeCategory } from '../types';

interface NodeLibraryProps {
  categories: NodeCategory[];
  onNodeAdd: (nodeType: string) => void;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ categories, onNodeAdd }) => {
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

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.id} className="border border-border rounded-md overflow-hidden">
          <button
            className="w-full p-2 bg-muted/50 text-left flex justify-between items-center cursor-pointer hover:bg-muted"
            onClick={() => toggleCategory(category.id)}
          >
            <span className="font-medium">{category.name}</span>
            <span className="text-xs">
              {expandedCategories.includes(category.id) ? '▼' : '►'}
            </span>
          </button>
          
          {expandedCategories.includes(category.id) && (
            <div className="p-2 space-y-1">
              {category.nodes.map((node) => (
                <button
                  key={node.type}
                  className="w-full p-2 text-left flex items-center gap-2 rounded hover:bg-accent cursor-pointer"
                  onClick={() => onNodeAdd(node.type)}
                >
                  <span className={`p-1 rounded ${node.colorClass}`}>
                    {node.icon}
                  </span>
                  <div className="flex-1">
                    <span className="block text-sm font-medium">{node.name}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {node.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {categories.length === 0 && (
        <div className="text-center p-4 text-muted-foreground">
          No nodes found.
        </div>
      )}
    </div>
  );
};

export default NodeLibrary;
