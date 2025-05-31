import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PlayIcon, StopIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { IExecutionResult, IWorkflowBase } from '../types/n8n';

interface Workflow extends IWorkflowBase {
  status: 'active' | 'inactive';
  trigger?: {
    type: 'manual' | 'webhook' | 'schedule' | 'api';
    config?: any;
  };
  lastExecution?: IExecutionResult;
}

interface ExecutionPanelProps {
  className?: string;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ className = '' }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState<Record<string, boolean>>({});

  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute workflow
  const executeWorkflow = async (workflowId: string) => {
    try {
      setIsExecuting(prev => ({ ...prev, [workflowId]: true }));
      
      const response = await fetch(`/api/execution/workflow/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'manual',
          inputData: {}
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Execution started:', result);
        
        // Refresh workflows to get updated last execution
        setTimeout(fetchWorkflows, 1000);
      } else {
        console.error('Failed to execute workflow');
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
    } finally {
      setIsExecuting(prev => ({ ...prev, [workflowId]: false }));
    }
  };

  // Cancel execution
  const cancelExecution = async (executionId: string) => {
    try {
      const response = await fetch(`/api/execution/${executionId}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        console.log('Execution cancelled');
        setTimeout(fetchWorkflows, 1000);
      }
    } catch (error) {
      console.error('Error cancelling execution:', error);
    }
  };

  // Refresh scheduler
  const refreshScheduler = async () => {
    try {
      const response = await fetch('/api/execution/scheduler/refresh', {
        method: 'POST'
      });

      if (response.ok) {
        console.log('Scheduler refreshed');
      }
    } catch (error) {
      console.error('Error refreshing scheduler:', error);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      running: 'default',
      completed: 'secondary',
      failed: 'destructive',
      cancelled: 'outline'
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Workflow Execution</h2>
          <div className="flex space-x-2">
            <Button
              onClick={fetchWorkflows}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button
              onClick={refreshScheduler}
              variant="outline"
              size="sm"
            >
              Refresh Scheduler
            </Button>
          </div>
        </div>

        {/* Workflow Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Workflow:</label>
          <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a workflow to execute" />
            </SelectTrigger>
            <SelectContent>
              {workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name} ({workflow.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Execute */}
        {selectedWorkflow && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Quick Execute</h3>
                <p className="text-sm text-gray-600">Execute the selected workflow manually</p>
              </div>
              <Button
                onClick={() => executeWorkflow(selectedWorkflow)}
                disabled={isExecuting[selectedWorkflow]}
                className="flex items-center space-x-2"
              >
                <PlayIcon className="w-4 h-4" />
                <span>{isExecuting[selectedWorkflow] ? 'Executing...' : 'Execute'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Workflows List */}
        <div className="space-y-3">
          <h3 className="font-medium">All Workflows</h3>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No workflows found. Create a workflow first.
            </div>
          ) : (
            <div className="space-y-2">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{workflow.name}</h4>
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status}
                      </Badge>
                      {workflow.trigger && (
                        <Badge variant="outline" className="capitalize">
                          {workflow.trigger.type}
                        </Badge>
                      )}
                    </div>
                    
                    {workflow.lastExecution && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Last execution:</span>
                        {getStatusBadge(workflow.lastExecution.status)}
                        <span>{formatTime(workflow.lastExecution.startTime)}</span>
                        {workflow.lastExecution.duration && (
                          <span>({formatDuration(workflow.lastExecution.duration)})</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => executeWorkflow(workflow.id)}
                      disabled={isExecuting[workflow.id]}
                      size="sm"
                      variant="outline"
                    >
                      <PlayIcon className="w-4 h-4" />
                    </Button>
                    
                    {workflow.lastExecution?.status === 'running' && (
                      <Button
                        onClick={() => cancelExecution(workflow.lastExecution!.id)}
                        size="sm"
                        variant="outline"
                      >
                        <StopIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ExecutionPanel;
