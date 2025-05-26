import { ReactNode, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { nodeCategories } from "../../data/nodeTypes";

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
  onNodeAdd,
}: WorkflowLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Provide a default noop function to ensure onNodeAdd is never undefined
  const handleNodeAdd = (nodeType: string) => {
    if (onNodeAdd) {
      onNodeAdd(nodeType);
    } else {
      console.log('Node add handler not provided for node type:', nodeType);
    }
  };

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
          onNodeAdd={handleNodeAdd}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
