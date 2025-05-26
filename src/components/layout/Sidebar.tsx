import React, { useState } from 'react';
import { NodeCategory } from '../../types';
import { NodeLibrary } from '../workflow/NodeLibrary';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';

interface SidebarProps {
  isOpen?: boolean;
  nodeCategories?: NodeCategory[];
  onNodeAdd?: (nodeType: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true, 
  nodeCategories = [], 
  onNodeAdd = () => {} 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter categories and nodes based on search query
  const filteredCategories = nodeCategories.map(category => ({
    ...category,
    nodes: category.nodes.filter(node => 
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);
  
  return (
    <div 
      className={`fixed top-16 left-0 w-72 h-[calc(100vh-4rem)] bg-background border-r border-border overflow-y-auto
      transition-transform duration-300 z-10 transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase font-semibold text-muted-foreground tracking-wider">Node Library</h2>
          <span className="text-xs text-muted-foreground">{nodeCategories.reduce((acc, cat) => acc + cat.nodes.length, 0)} nodes</span>
        </div>
        
        {/* Search bar */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-4 py-2 w-full bg-background"
          />
        </div>
        
        <div className="overflow-y-auto pb-20">
          {filteredCategories.length > 0 ? (
            <NodeLibrary categories={filteredCategories} onNodeAdd={onNodeAdd} />
          ) : (
            <div className="bg-background/80 border border-border rounded-lg p-6 text-center">
              <p className="text-muted-foreground mb-2">No matching nodes found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search criteria</p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-xs text-primary hover:text-primary/80 transition-colors duration-200"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 