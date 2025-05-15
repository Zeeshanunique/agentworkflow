import React from 'react';
import { Menu, Settings, User } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 mr-2 md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center">
          <div className="bg-indigo-600 text-white p-1.5 rounded mr-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">FlowAI</h1>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
          <Settings size={20} />
        </button>
        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
          <User size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;