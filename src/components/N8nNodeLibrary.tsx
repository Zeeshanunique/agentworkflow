// N8n-style Node Library Component
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { nodeCategories, getNodeDescription } from '../../data/n8nNodeRegistry';
import { useWorkflowStore } from '../../hooks/useWorkflowStore';

interface NodeLibraryProps {
  onNodeSelect?: (nodeType: string) => void;
  className?: string;
}

export function N8nNodeLibrary({ onNodeSelect, className = '' }: NodeLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['triggers', 'core']) // Default expanded categories
  );
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const addNode = useWorkflowStore(state => state.addNode);

  // Filter nodes based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return nodeCategories;
    }

    const term = searchTerm.toLowerCase();
    return nodeCategories.map(category => ({
      ...category,
      nodes: category.nodes.filter(nodeName => {
        const description = getNodeDescription(nodeName);
        return (
          nodeName.toLowerCase().includes(term) ||
          description?.displayName.toLowerCase().includes(term) ||
          description?.description.toLowerCase().includes(term)
        );
      })
    })).filter(category => category.nodes.length > 0);
  }, [searchTerm]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleNodeDragStart = (event: React.DragEvent, nodeType: string) => {
    setDraggedNode(nodeType);
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeDragEnd = () => {
    setDraggedNode(null);
  };

  const handleNodeClick = (nodeType: string) => {
    if (onNodeSelect) {
      onNodeSelect(nodeType);
    } else {
      // Add node to center of canvas
      addNode(nodeType, { x: 250, y: 250 });
    }
  };

  const getNodeIcon = (nodeName: string) => {
    const description = getNodeDescription(nodeName);
    // For now, return category-based icons
    const category = nodeCategories.find(cat => cat.nodes.includes(nodeName));
    
    switch (category?.id) {
      case 'triggers':
        return '🚀';
      case 'core':
        return '⚙️';
      case 'ai':
        return '🤖';
      default:
        return '📦';
    }
  };

  const getNodeColor = (nodeName: string) => {
    const category = nodeCategories.find(cat => cat.nodes.includes(nodeName));
    
    switch (category?.id) {
      case 'triggers':
        return 'bg-green-500 hover:bg-green-600';
      case 'core':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'ai':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card className={`w-80 h-full overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Node Library</CardTitle>
        <CardDescription>
          Drag and drop nodes to build your workflow
        </CardDescription>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto flex-1">
        <div className="space-y-2 p-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="border rounded-lg">
              {/* Category Header */}
              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto text-left"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.nodes.length}
                  </Badge>
                </div>
                {expandedCategories.has(category.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              {/* Category Nodes */}
              {expandedCategories.has(category.id) && (
                <div className="border-t bg-gray-50/50">
                  <div className="p-2 space-y-1">
                    {category.nodes.map((nodeName) => {
                      const description = getNodeDescription(nodeName);
                      const isDragging = draggedNode === nodeName;
                      
                      return (
                        <div
                          key={nodeName}
                          draggable
                          onDragStart={(e) => handleNodeDragStart(e, nodeName)}
                          onDragEnd={handleNodeDragEnd}
                          onClick={() => handleNodeClick(nodeName)}
                          className={`
                            flex items-center space-x-3 p-3 rounded-md cursor-move
                            transition-all duration-200 border border-transparent
                            hover:border-gray-300 hover:shadow-sm
                            ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}
                            ${getNodeColor(nodeName).replace('bg-', 'hover:bg-').replace('hover:bg-', 'bg-')}
                            text-white
                          `}
                          title={description?.description}
                        >
                          {/* Node Icon */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-white/20 flex items-center justify-center text-sm">
                            {getNodeIcon(nodeName)}
                          </div>
                          
                          {/* Node Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {description?.displayName || nodeName}
                            </div>
                            {description?.description && (
                              <div className="text-xs text-white/80 truncate">
                                {description.description}
                              </div>
                            )}
                          </div>
                          
                          {/* Node Badge */}
                          <div className="flex-shrink-0">
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-white/20 text-white border-white/20"
                            >
                              {description?.group?.[0] || 'node'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No nodes found matching "{searchTerm}"</p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default N8nNodeLibrary;
