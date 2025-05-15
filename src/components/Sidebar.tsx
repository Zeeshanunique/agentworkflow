import React from 'react';
import { NodeCategory } from '../types';
import NodeLibrary from './NodeLibrary';

interface SidebarProps {
  isOpen: boolean;
  nodeCategories: NodeCategory[];
  onNodeAdd: (nodeType: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, nodeCategories, onNodeAdd }) => {
  return (
    <div 
      className={`fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
      transition-transform duration-300 z-10 transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="p-4">
        <h2 className="text-sm uppercase font-semibold text-gray-500 mb-4">Node Library</h2>
        <NodeLibrary categories={nodeCategories} onNodeAdd={onNodeAdd} />
      </div>
    </div>
  );
};

export default Sidebar;