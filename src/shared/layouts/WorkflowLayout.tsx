import { ReactNode, useState } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { nodeCategories } from '../../data/nodeTypes';

type WorkflowLayoutProps = {
  children: ReactNode;
  isAuthenticated?: boolean;
  username?: string;
  onNodeAdd?: (nodeType: string) => void;
};

export default function WorkflowLayout({ 
  children, 
  isAuthenticated, 
  username,
  onNodeAdd 
}: WorkflowLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        isAuthenticated={isAuthenticated} 
        username={username} 
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          nodeCategories={nodeCategories}
          onNodeAdd={onNodeAdd}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 