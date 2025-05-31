import { useState } from "react";
import { useToast } from "../../components/ToastProvider";
import { useWorkflowStore } from "../../hooks/useWorkflowStore";
import { executeWorkflow } from "../../utils/workflowExecutor";
import { MainLayout } from "../../components/layout";
import Toolbar from "../../components/Toolbar";
import CanvasFlow from "../../components/CanvasFlow";
import { Sidebar } from "../../components/layout";
import { n8nNodeCategories } from "../../data/n8nNodeTypes";

interface WorkflowPageProps {
  username?: string;
}

export default function WorkflowPage({
  username,
}: WorkflowPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);

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

      // Execute the workflow
      const result = await executeWorkflow(nodes, connections);

      // Update node statuses based on results
      if (result.success) {
        // Mark all nodes as successful
        nodes.forEach((node) => {
          setNodeStatus(node.id, "success", "Completed successfully");
        });

        toast({
          title: "Workflow executed",
          description: "Your workflow has been successfully executed",
        });

        // Log results to console for debugging
        console.log("Workflow execution results:", result.results);
      } else {
        // Find which node had the error
        const errorNodeId = result.error ? result.error.split('"')[1] : null;

        // Mark nodes accordingly
        nodes.forEach((node) => {
          if (node.id === errorNodeId) {
            setNodeStatus(node.id, "error", result.error || "Execution failed");
          } else {
            // If the node has results, it completed successfully
            if (result.results[node.id]) {
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
