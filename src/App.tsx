import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import Toolbar from './components/Toolbar';
import { useWorkflow } from './hooks/useWorkflow';
import { nodeCategories } from './data/nodeTypes';
import { Position } from './types';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const workflow = useWorkflow();

  const handleNodeAdd = (nodeType: string) => {
    // Add node with a random position near the center of the canvas
    const randomX = Math.floor(Math.random() * 200) + 100;
    const randomY = Math.floor(Math.random() * 200) + 100;
    workflow.addNode(nodeType, { x: randomX, y: randomY });
  };

  const handleCanvasDrop = (e: React.DragEvent, canvasPos: Position) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    
    if (nodeType) {
      // Calculate the drop position relative to the canvas
      workflow.addNode(nodeType, {
        x: e.clientX - canvasPos.x,
        y: e.clientY - canvasPos.y
      });
    }
  };

  const handleSaveWorkflow = () => {
    const workflowData = {
      nodes: workflow.nodes,
      connections: workflow.connections
    };
    
    // For demonstration, just log the data, but in a real app, you'd save to backend
    console.log('Saving workflow:', workflowData);
    
    // Show a toast or notification to the user
    alert('Workflow saved successfully!');
  };

  const handleExportWorkflow = () => {
    const workflowData = {
      nodes: workflow.nodes,
      connections: workflow.connections,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(workflowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'workflow.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportWorkflow = () => {
    // In a real implementation, you'd have a file input
    alert('Import functionality would be implemented here');
  };

  return (
    <div className="flex flex-col h-screen">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          nodeCategories={nodeCategories}
          onNodeAdd={handleNodeAdd}
        />
        
        <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : ''}`}>
          <Toolbar 
            onSave={handleSaveWorkflow}
            onClear={workflow.clearWorkflow}
            onRun={workflow.runWorkflow}
            onNew={() => workflow.clearWorkflow()}
            onExport={handleExportWorkflow}
            onImport={handleImportWorkflow}
            isRunning={workflow.isRunning}
          />
          
          <div className="flex flex-1 overflow-hidden">
            <Canvas 
              nodes={workflow.nodes}
              connections={workflow.connections}
              onNodeSelect={workflow.setSelectedNodeId}
              onNodeMove={workflow.moveNode}
              onNodeConnect={workflow.connectNodes}
              selectedNodeId={workflow.selectedNodeId}
            />
            
            {workflow.selectedNode && (
              <PropertiesPanel 
                selectedNode={workflow.selectedNode}
                onClose={() => workflow.setSelectedNodeId(null)}
                onUpdateNode={workflow.updateNode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;