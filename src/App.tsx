import { useState } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useWorkflowStore } from './hooks/useWorkflowStore';
import { Route } from 'wouter';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

import Toolbar from './components/Toolbar';
import { nodeCategories } from './data/nodeTypes';
import { useToast } from './components/ToastProvider';

import CanvasFlow from './components/CanvasFlow';

function WorkflowEditor({ isAuthenticated, username }: { isAuthenticated?: boolean; username?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);

  // Zustand store for workflow state
  const nodes = useWorkflowStore((state) => state.nodes);
  const connections = useWorkflowStore((state) => state.connections);
  const addNode = useWorkflowStore((state) => state.addNode);

  const moveNode = useWorkflowStore((state) => state.moveNode);
  const addConnection = useWorkflowStore((state) => state.addConnection);

  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const selectNode = useWorkflowStore((state) => state.selectNode);

  // Add node from sidebar
  const handleAddNode = (nodeType: string) => {
    // Place new node at a default position (center-ish)
    const position = { x: 400 + Math.random() * 100, y: 200 + Math.random() * 100 };
    addNode(nodeType, position);
    toast({ title: 'Node added', description: `Added ${nodeType} node` });
  };

  
  const handleRunWorkflow = () => {
    setIsRunning(true);
    
    // Simulate workflow execution
    setTimeout(() => {
      setIsRunning(false);
      toast({
        title: "Workflow executed",
        description: "Your workflow has been successfully executed",
      });
    }, 2000);
  };
  
  const handleStopWorkflow = () => {
    setIsRunning(false);
    toast({
      title: "Workflow stopped",
      description: "Execution has been stopped",
    });
  };
  
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} isAuthenticated={isAuthenticated} username={username} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          nodeCategories={nodeCategories}
          onNodeAdd={handleAddNode}
        />
        <div className="flex-1 flex flex-col">
          <Toolbar 
            onRun={handleRunWorkflow}
            onStop={handleStopWorkflow}
            isRunning={isRunning}
            isCollaborating={false}
          />
          <div className="flex-1">
            <CanvasFlow
              nodes={nodes}
              connections={connections}
              onNodeSelect={selectNode}
              onNodeMove={moveNode}
              onNodeConnect={addConnection}
              selectedNodeId={selectedNodeId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const user = useWorkflowStore((state) => state.user);
  const isAuthenticated = useWorkflowStore((state) => state.isAuthenticated);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== '/login') {
      navigate('/login', { replace: true });
    } else if (isAuthenticated && window.location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Route path="/login" component={isAuthenticated ? () => null : AuthForm} />
      <Route path="/" component={() => <WorkflowEditor isAuthenticated={isAuthenticated} username={user?.username} />} />
    </>
  );
}

export default App;
