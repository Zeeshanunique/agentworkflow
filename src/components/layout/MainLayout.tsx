import React, { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useWorkflowStore } from '../../hooks/useWorkflowStore';

interface MainLayoutProps {
  children: ReactNode;
  username?: string;
  isAuthenticated?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  username,
  isAuthenticated: propIsAuthenticated 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Get authentication from store if not provided in props
  const storeIsAuthenticated = useWorkflowStore((state) => state.isAuthenticated);
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : storeIsAuthenticated;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          username={username} 
          isAuthenticated={isAuthenticated}
          toggleSidebar={toggleSidebar} 
        />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}; 