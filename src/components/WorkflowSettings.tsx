import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import WorkflowTriggers, { TriggerConfig } from './WorkflowTriggers';
import { Settings } from 'lucide-react';

interface WorkflowSettingsProps {
  workflowId?: string;
  workflowName?: string;
  workflowDescription?: string;
  currentTrigger?: TriggerConfig;
  onSave?: (settings: {
    name: string;
    description: string;
    trigger: TriggerConfig;
  }) => void;
  className?: string;
}

export const WorkflowSettings: React.FC<WorkflowSettingsProps> = ({
  workflowId,
  workflowName = '',
  workflowDescription = '',
  currentTrigger,
  onSave,
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(workflowName);
  const [description, setDescription] = useState(workflowDescription);
  const [trigger, setTrigger] = useState<TriggerConfig>(
    currentTrigger || { type: 'manual' }
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    try {
      setIsLoading(true);
      
      if (onSave) {
        await onSave({
          name: name.trim(),
          description: description.trim(),
          trigger
        });
      }

      setOpen(false);
    } catch (error) {
      console.error('Failed to save workflow settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      name,
      description,
      trigger,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-${name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateWebhookCode = () => {
    if (trigger.type !== 'webhook' || !trigger.config?.path) return '';

    const url = `${window.location.origin}/webhook${trigger.config.path}`;
    const method = trigger.config.method || 'POST';

    return `// JavaScript Example
fetch('${url}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    // Your payload data here
    data: 'example'
  })
});

// cURL Example
curl -X ${method} \\
  -H "Content-Type: application/json" \\
  -d '{"data": "example"}' \\
  ${url}

// Python Example
import requests

response = requests.${method.toLowerCase()}(
    '${url}',
    json={'data': 'example'}
)`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter workflow name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Workflow ID</Label>
                <Input
                  value={workflowId || 'Not saved yet'}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={handleExport} variant="outline">
                  Export Settings
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4">
            <WorkflowTriggers
              workflowId={workflowId}
              currentTrigger={trigger}
              onTriggerChange={setTrigger}
            />
          </TabsContent>

          <TabsContent value="integration" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Integration Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use these code examples to integrate with your workflow
                </p>
              </div>

              {trigger.type === 'webhook' && trigger.config?.path && (
                <div className="space-y-4">
                  <div>
                    <Label>Webhook Integration Examples</Label>
                    <Textarea
                      value={generateWebhookCode()}
                      readOnly
                      rows={15}
                      className="font-mono text-sm bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {trigger.type === 'api' && trigger.config?.endpoint && (
                <div className="space-y-4">
                  <div>
                    <Label>API Integration</Label>
                    <div className="p-4 bg-gray-50 border rounded">
                      <h5 className="font-medium mb-2">Endpoint</h5>
                      <code className="text-sm">
                        POST {window.location.origin}{trigger.config.endpoint}
                      </code>
                      
                      <h5 className="font-medium mt-4 mb-2">Headers</h5>
                      <code className="text-sm">
                        Content-Type: application/json
                        {trigger.config.apiKey && (
                          <><br />Authorization: Bearer {trigger.config.apiKey}</>
                        )}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {trigger.type === 'schedule' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <h5 className="font-medium text-blue-900 mb-2">Scheduled Execution</h5>
                    <p className="text-sm text-blue-700">
                      This workflow will run automatically based on the schedule: 
                      <code className="ml-2 px-2 py-1 bg-white rounded">
                        {trigger.config?.cron}
                      </code>
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Timezone: {trigger.config?.timezone || 'UTC'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded">
                  <h5 className="font-medium mb-2">Execution Settings</h5>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Enable execution timeout (30 minutes)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Save execution history</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Send notifications on failure</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <h5 className="font-medium mb-2">Error Handling</h5>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Retry failed nodes (max 3 attempts)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Continue on error</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <h5 className="font-medium mb-2">Security</h5>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Require authentication for webhook triggers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Log all execution attempts</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowSettings;
