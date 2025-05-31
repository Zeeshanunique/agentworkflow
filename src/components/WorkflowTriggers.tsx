import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

export interface TriggerConfig {
  type: 'manual' | 'webhook' | 'schedule' | 'api';
  config?: {
    // Webhook config
    path?: string;
    method?: string;
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'api-key';
      credentials?: Record<string, string>;
    };
    
    // Schedule config
    cron?: string;
    timezone?: string;
    
    // API config
    endpoint?: string;
    apiKey?: string;
  };
}

interface WorkflowTriggersProps {
  workflowId?: string;
  currentTrigger?: TriggerConfig;
  onTriggerChange?: (trigger: TriggerConfig) => void;
  className?: string;
}

export const WorkflowTriggers: React.FC<WorkflowTriggersProps> = ({
  workflowId,
  currentTrigger,
  onTriggerChange,
  className = ''
}) => {  const [trigger, setTrigger] = useState<TriggerConfig>(
    currentTrigger || { type: 'manual' }
  );
  const [webhooks, setWebhooks] = useState<any[]>([]);
  // Fetch existing webhooks
  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/webhook/list');
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    }
  };

  React.useEffect(() => {
    if (trigger.type === 'webhook') {
      fetchWebhooks();
    }
  }, [trigger.type]);
  const handleTriggerTypeChange = (type: string) => {
    const newTrigger: TriggerConfig = { type: type as TriggerConfig['type'] };
    
    // Set default config based on type
    switch (type) {
      case 'webhook':
        newTrigger.config = {
          path: workflowId ? `/workflow/${workflowId}` : '/workflow/new',
          method: 'POST',
          authentication: { 
            type: 'none' as const,
            credentials: {}
          }
        };
        break;
      case 'schedule':
        newTrigger.config = {
          cron: '0 9 * * 1', // Every Monday at 9 AM
          timezone: 'UTC'
        };
        break;
      case 'api':
        newTrigger.config = {
          endpoint: `/api/trigger/${workflowId || 'new'}`,
          apiKey: ''
        };
        break;
    }
    
    setTrigger(newTrigger);
    if (onTriggerChange) {
      onTriggerChange(newTrigger);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    const newTrigger = {
      ...trigger,
      config: {
        ...trigger.config,
        [key]: value
      }
    };
    setTrigger(newTrigger);
    if (onTriggerChange) {
      onTriggerChange(newTrigger);
    }
  };
  const handleAuthChange = (key: string, value: any) => {
    const newTrigger = {
      ...trigger,
      config: {
        ...trigger.config,
        authentication: {
          type: 'none' as const,
          credentials: {},
          ...trigger.config?.authentication,
          [key]: value
        }
      }
    };
    setTrigger(newTrigger);
    if (onTriggerChange) {
      onTriggerChange(newTrigger);
    }
  };

  const testWebhook = async () => {
    if (!trigger.config?.path) return;
    
    try {
      const response = await fetch(`/webhook/test${trigger.config.path}`, {
        method: trigger.config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true, timestamp: Date.now() })
      });
      
      if (response.ok) {
        alert('Webhook test successful!');
      } else {
        alert('Webhook test failed');
      }
    } catch (error) {
      alert('Webhook test error: ' + error);
    }
  };

  const validateCron = (cronExpression: string) => {
    // Basic cron validation
    const parts = cronExpression.split(' ');
    return parts.length === 5 || parts.length === 6;
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Workflow Triggers</h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure how this workflow should be triggered
          </p>
        </div>

        {/* Trigger Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="trigger-type">Trigger Type</Label>
          <Select value={trigger.type} onValueChange={handleTriggerTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select trigger type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="schedule">Schedule (Cron)</SelectItem>
              <SelectItem value="api">API Endpoint</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Manual Trigger */}
        {trigger.type === 'manual' && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Manual Trigger</h4>
            <p className="text-sm text-gray-600">
              This workflow will only run when manually executed or triggered via the API.
            </p>
          </div>
        )}

        {/* Webhook Trigger */}
        {trigger.type === 'webhook' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-path">Webhook Path</Label>
                <Input
                  id="webhook-path"
                  value={trigger.config?.path || ''}
                  onChange={(e) => handleConfigChange('path', e.target.value)}
                  placeholder="/webhook/my-workflow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-method">HTTP Method</Label>
                <Select
                  value={trigger.config?.method || 'POST'}
                  onValueChange={(value) => handleConfigChange('method', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-auth">Authentication</Label>
              <Select
                value={trigger.config?.authentication?.type || 'none'}
                onValueChange={(value) => handleAuthChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {trigger.config?.path && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-blue-900">Webhook URL</h5>
                    <code className="text-sm text-blue-700">
                      {window.location.origin}/webhook{trigger.config.path}
                    </code>
                  </div>
                  <Button onClick={testWebhook} size="sm" variant="outline">
                    Test
                  </Button>
                </div>
              </div>
            )}

            {/* Existing Webhooks */}
            {webhooks.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Webhooks</Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {webhooks.map((webhook, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <span className="font-mono">{webhook.path}</span>
                      <Badge variant="outline">{webhook.method}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule Trigger */}
        {trigger.type === 'schedule' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cron-expression">Cron Expression</Label>
              <Input
                id="cron-expression"
                value={trigger.config?.cron || ''}
                onChange={(e) => handleConfigChange('cron', e.target.value)}
                placeholder="0 9 * * 1"
                className={
                  trigger.config?.cron && !validateCron(trigger.config.cron)
                    ? 'border-red-300'
                    : ''
                }
              />
              <p className="text-xs text-gray-500">
                Format: minute hour day month day-of-week
                <br />
                Example: "0 9 * * 1" = Every Monday at 9:00 AM
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={trigger.config?.timezone || 'UTC'}
                onChange={(e) => handleConfigChange('timezone', e.target.value)}
                placeholder="UTC"
              />
            </div>

            {trigger.config?.cron && validateCron(trigger.config.cron) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="font-medium text-green-900">Schedule Active</h5>
                <p className="text-sm text-green-700">
                  This workflow will run automatically based on the cron schedule.
                </p>
              </div>
            )}
          </div>
        )}

        {/* API Trigger */}
        {trigger.type === 'api' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-endpoint">API Endpoint</Label>
              <Input
                id="api-endpoint"
                value={trigger.config?.endpoint || ''}
                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                placeholder="/api/trigger/my-workflow"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key (optional)</Label>
              <Input
                id="api-key"
                type="password"
                value={trigger.config?.apiKey || ''}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                placeholder="Enter API key for authentication"
              />
            </div>

            {trigger.config?.endpoint && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-900">API Endpoint</h5>
                <code className="text-sm text-blue-700">
                  POST {window.location.origin}{trigger.config.endpoint}
                </code>
                <p className="text-xs text-blue-600 mt-1">
                  Send POST requests to this endpoint to trigger the workflow
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default WorkflowTriggers;
