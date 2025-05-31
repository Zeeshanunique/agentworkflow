import { useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useWorkflowStore } from "../../hooks/useWorkflowStore";
import { executeWorkflow } from "../../utils/workflowExecutor";
import { MainLayout } from "../../components/layout";
import Toolbar from "../../components/Toolbar";
import CanvasFlow from "../../components/CanvasFlow";
import { Sidebar } from "../../components/layout";
import { n8nNodeCategories } from "../../data/n8nNodeTypes";
import { TriggerConfig } from "../../components/WorkflowTriggers";

interface WorkflowPageProps {
  username?: string;
}

export default function WorkflowPage({
  username,
}: WorkflowPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  
  // Workflow metadata
  const [workflowId, setWorkflowId] = useState<string>('');
  const [workflowName, setWorkflowName] = useState<string>('');
  const [workflowDescription, setWorkflowDescription] = useState<string>('');
  const [workflowTrigger, setWorkflowTrigger] = useState<TriggerConfig>({ type: 'manual' });

  // Zustand store for workflow state
  const nodes = useWorkflowStore((state) => state.nodes);
  const connections = useWorkflowStore((state) => state.connections);
  const addNode = useWorkflowStore((state) => state.addNode);
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const moveNode = useWorkflowStore((state) => state.moveNode);
  const addConnection = useWorkflowStore((state) => state.addConnection);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const nodeStatuses = useWorkflowStore((state) => state.nodeStatuses);
  const setNodeStatus = useWorkflowStore((state) => state.setNodeStatus);
  const resetNodeStatuses = useWorkflowStore(
    (state) => state.resetNodeStatuses,
  );
  const deleteNode = useWorkflowStore((state) => state.deleteNode);

  // Add node from sidebar
  const handleAddNode = (nodeType: string) => {
    // Place new node at a default position (center-ish)
    const position = {
      x: 400 + Math.random() * 100,
      y: 200 + Math.random() * 100,
    };
    addNode(nodeType, position);
    toast({ title: "Node added", description: `Added ${nodeType} node` });
  };

  // Handle node parameter changes
  const handleNodeParametersChange = (
    nodeId: string,
    parameters: Record<string, string>,
  ) => {
    updateNode(nodeId, { parameters });
  };

  const handleRunWorkflow = async () => {
    setIsRunning(true);

    try {
      // Check if there are any nodes to execute
      if (nodes.length === 0) {
        toast({
          title: "No nodes in workflow",
          description: "Please add nodes to your workflow before running.",
        });
        setIsRunning(false);
        return;
      }

      // Reset all node statuses before execution
      resetNodeStatuses();

      // Set all nodes to 'running' status
      nodes.forEach((node) => {
        setNodeStatus(node.id, "running", "Executing...");
      });

      // Use the backend execution API if available, otherwise fall back to local execution
      let result: { success: boolean; results?: any; error?: string } | undefined;
      try {
        // First, try to save/update the workflow
        const workflowData = {
          name: `Workflow ${Date.now()}`,
          nodes,
          connections,
          trigger: { type: 'manual' }
        };

        // Create or update workflow
        const saveResponse = await fetch('/api/workflows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowData)
        });

        if (saveResponse.ok) {
          const savedWorkflow = await saveResponse.json();
          
          // Execute via backend API
          const executeResponse = await fetch(`/api/execution/workflow/${savedWorkflow.id}/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trigger: 'manual',
              inputData: {}
            })
          });

          if (executeResponse.ok) {
            const executionResult = await executeResponse.json();
            
            // Poll for execution status
            let executionComplete = false;
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds timeout
            
            while (!executionComplete && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              
              const statusResponse = await fetch(`/api/execution/${executionResult.executionId}/status`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                
                if (statusData.status === 'completed') {
                  result = { success: true, results: statusData.results || {} };
                  executionComplete = true;
                } else if (statusData.status === 'failed') {
                  result = { success: false, error: statusData.error || 'Execution failed' };
                  executionComplete = true;
                } else if (statusData.status === 'cancelled') {
                  result = { success: false, error: 'Execution was cancelled' };
                  executionComplete = true;
                }
                
                // Update node statuses if available
                if (statusData.nodeStatuses) {
                  Object.entries(statusData.nodeStatuses).forEach(([nodeId, status]: [string, any]) => {
                    if (status.status === 'completed') {
                      setNodeStatus(nodeId, "success", "Completed successfully");
                    } else if (status.status === 'failed') {
                      setNodeStatus(nodeId, "error", status.error || "Failed");
                    } else if (status.status === 'running') {
                      setNodeStatus(nodeId, "running", "Executing...");
                    }
                  });
                }
              }
              
              attempts++;
            }
            
            if (!executionComplete) {
              result = { success: false, error: 'Execution timeout' };
            }
          } else {
            throw new Error('Failed to start execution via API');
          }
        } else {
          throw new Error('Failed to save workflow');
        }
      } catch (apiError) {
        console.warn('Backend execution failed, falling back to local execution:', apiError);
        
        // Fall back to local execution
        result = await executeWorkflow(nodes, connections);
      }

      // Update node statuses based on results
      if (result?.success) {
        // Mark all nodes as successful if not already updated
        nodes.forEach((node) => {
          if (nodeStatuses[node.id]?.status !== "success") {
            setNodeStatus(node.id, "success", "Completed successfully");
          }
        });

        toast({
          title: "Workflow executed",
          description: "Your workflow has been successfully executed",
        });

        // Log results to console for debugging
        console.log("Workflow execution results:", result.results);
      } else if (result) {
        // Find which node had the error
        const errorNodeId = result.error ? result.error.split('"')[1] : null;

        // Mark nodes accordingly
        nodes.forEach((node) => {
          if (node.id === errorNodeId) {
            setNodeStatus(node.id, "error", result.error || "Execution failed");
          } else {
            // If the node has results, it completed successfully
            if (result.results && result.results[node.id]) {
              setNodeStatus(node.id, "success", "Completed successfully");
            } else {
              setNodeStatus(node.id, "idle", "Not executed");
            }
          }
        });

        toast({
          title: "Workflow execution error",
          description:
            result.error || "There was an error executing the workflow",
        });
      }
    } catch (error: any) {
      console.error("Error executing workflow:", error);
      toast({
        title: "Workflow execution error",
        description: error.message || "There was an unexpected error",
      });

      // Mark all nodes as idle if there was an unexpected error
      nodes.forEach((node) => {
        setNodeStatus(node.id, "idle", "Execution failed");
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopWorkflow = () => {
    setIsRunning(false);
    // Reset all node statuses
    resetNodeStatuses();
    toast({
      title: "Workflow stopped",
      description: "Execution has been stopped",
    });
  };
  
  // Handle workflow settings save
  const handleSettingsSave = async (settings: {
    name: string;
    description: string;
    trigger: TriggerConfig;
  }) => {
    try {
      setWorkflowName(settings.name);
      setWorkflowDescription(settings.description);
      setWorkflowTrigger(settings.trigger);

      // Save to backend if workflowId exists, otherwise create new
      const workflowData = {
        name: settings.name,
        description: settings.description,
        nodes,
        connections,
        trigger: settings.trigger
      };

      const method = workflowId ? 'PUT' : 'POST';
      const url = workflowId ? `/api/workflows/${workflowId}` : '/api/workflows';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData)
      });

      if (response.ok) {
        const savedWorkflow = await response.json();
        if (!workflowId) {
          setWorkflowId(savedWorkflow.id);
        }
        
        toast({
          title: "Settings saved",
          description: "Workflow settings have been saved successfully",
        });
      } else {
        throw new Error('Failed to save workflow');
      }
    } catch (error) {
      console.error('Failed to save workflow settings:', error);
      toast({
        title: "Save failed",
        description: "Failed to save workflow settings",
      });
      throw error;
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <MainLayout username={username}>
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Render the sidebar outside the main content flow due to its fixed positioning */}
        <Sidebar 
          isOpen={sidebarOpen}
          nodeCategories={n8nNodeCategories}
          onNodeAdd={handleAddNode}
        />

        {/* Main content with margin to account for the fixed sidebar */}
        <div className={`flex-1 flex flex-col h-full ${sidebarOpen ? 'ml-72' : 'ml-0'} transition-all duration-300`}>
          <Toolbar
            onRun={handleRunWorkflow}
            onStop={handleStopWorkflow}
            isRunning={isRunning}
            isCollaborating={false}
            onToggleSidebar={toggleSidebar}
            workflowId={workflowId}
            workflowName={workflowName}
            workflowDescription={workflowDescription}
            currentTrigger={workflowTrigger}
            onSettingsSave={handleSettingsSave}
          />
          <div className="flex-1 h-[calc(100vh-112px)]">
            <CanvasFlow
              nodes={nodes}
              connections={connections}
              onNodeSelect={selectNode}
              onNodeMove={moveNode}
              onNodeConnect={addConnection}
              onNodeParametersChange={handleNodeParametersChange}
              selectedNodeId={selectedNodeId}
              nodeStatuses={nodeStatuses}
              onNodeDelete={deleteNode}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
