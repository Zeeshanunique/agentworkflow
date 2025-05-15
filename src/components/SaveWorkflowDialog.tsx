// filepath: /workspaces/agentworkflow/src/components/SaveWorkflowDialog.tsx
import React, { useState } from 'react';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import { workflowApi } from '../lib/api';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';

interface SaveWorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}

const SaveWorkflowDialog: React.FC<SaveWorkflowDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { id, name, description, nodes, connections, isPublic, updateWorkflowMeta } = useWorkflowStore();
  
  const [workflowName, setWorkflowName] = useState(name);
  const [workflowDescription, setWorkflowDescription] = useState(description || '');
  const [workflowIsPublic, setWorkflowIsPublic] = useState(isPublic);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!workflowName.trim()) {
      setError('Workflow name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update the metadata in the store
      updateWorkflowMeta({
        name: workflowName,
        description: workflowDescription,
        isPublic: workflowIsPublic
      });

      // Prepare the workflow data
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        content: {
          nodes,
          connections
        },
        isPublic: workflowIsPublic,
      };

      // Send to the server
      let savedId;
      if (id) {
        // Update existing workflow
        await workflowApi.update(id, workflowData);
        savedId = id;
      } else {
        // Create new workflow
        const result = await workflowApi.saveWorkflow(workflowData);
        savedId = result.data?.workflow.id || "";
      }

      setIsSaving(false);
      onSaved(savedId);
    } catch (err) {
      setIsSaving(false);
      setError('Failed to save workflow. Please try again.');
      console.error('Error saving workflow:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{id ? 'Save Workflow' : 'Create New Workflow'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="public" className="text-right">
              Public
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Checkbox
                id="public"
                checked={workflowIsPublic}
                onCheckedChange={(checked: boolean | 'indeterminate') => setWorkflowIsPublic(!!checked)}
              />
              <label htmlFor="public" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Make this workflow public
              </label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveWorkflowDialog;
