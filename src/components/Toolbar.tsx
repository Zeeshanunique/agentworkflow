import React from "react";
import { Save, Play, Plus, Users, Square, Menu } from "lucide-react";
import { Button } from "./ui/button";
import WorkflowSettings from "./WorkflowSettings";
import { TriggerConfig } from "./WorkflowTriggers";

interface ToolbarProps {
  onSave?: () => void;
  onRun?: () => void;
  onStop?: () => void;
  isRunning?: boolean;
  isCollaborating?: boolean;
  onToggleSidebar?: () => void;
  workflowId?: string;
  workflowName?: string;
  workflowDescription?: string;
  currentTrigger?: TriggerConfig;
  onSettingsSave?: (settings: {
    name: string;
    description: string;
    trigger: TriggerConfig;
  }) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onRun,
  onStop,
  isRunning = false,
  isCollaborating = false,
  onToggleSidebar,
  workflowId,
  workflowName,
  workflowDescription,
  currentTrigger,
  onSettingsSave,
}) => {
  return (
    <div className="bg-background border-b border-border py-2 px-4 flex items-center gap-2">
      {onToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu size={18} />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        title="New Workflow"
        className="text-muted-foreground hover:text-foreground"
      >
        <Plus size={18} />
      </Button>

      {onSave && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSave}
          title="Save Workflow"
          className="text-muted-foreground hover:text-foreground"
        >
          <Save size={18} />
        </Button>
      )}

      <div className="h-5 border-r border-border mx-1"></div>

      {isRunning ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onStop}
          title="Stop Execution"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Square size={18} />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRun}
          title="Run Workflow"
          className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <Play size={18} />
        </Button>
      )}

      <div className="flex-grow"></div>

      <WorkflowSettings
        workflowId={workflowId}
        workflowName={workflowName}
        workflowDescription={workflowDescription}
        currentTrigger={currentTrigger}
        onSave={onSettingsSave}
        className="mr-2"
      />

      {isCollaborating && (
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Users size={16} />
          <span className="text-xs font-medium">Collaborating</span>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
