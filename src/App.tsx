import React, { useState } from 'react';
import { Route } from 'wouter';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CanvasFlow from './components/CanvasFlow';
import Toolbar from './components/Toolbar';
import { nodeCategories } from './data/nodeTypes';
import { useToast } from './components/ToastProvider';

function WorkflowEditor() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  
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
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          nodeCategories={nodeCategories}
          onNodeAdd={() => {}}
        />
        
        <div className="flex-1 flex flex-col">
          <Toolbar 
            onRun={handleRunWorkflow}
            onStop={handleStopWorkflow}
            isRunning={isRunning}
            isCollaborating={false}
          />
          
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Agent Workflow Builder</h2>
              <p className="text-muted-foreground mb-4">
                Create and automate AI agent workflows with a visual editor
              </p>
              <p className="text-sm text-muted-foreground">
                Click any node from the sidebar to get started
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <Route path="/login" component={AuthForm} />
      <Route path="/" component={WorkflowEditor} />
    </>
  );
}

export default App;
