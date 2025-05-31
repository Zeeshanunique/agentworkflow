import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PlayIcon, StopIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface ExecutionLog {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  trigger: 'manual' | 'webhook' | 'schedule' | 'api';
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: string;
  results?: Record<string, any>;
  nodeStatuses?: Record<string, {
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: string;
    endTime?: string;
    error?: string;
    output?: any;
  }>;
}

export interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  totalDuration: number;
  executions24h: number;
  successRate: number;
}

interface ExecutionMonitorProps {
  workflowId?: string;
  onExecute?: () => void;
  onCancel?: (executionId: string) => void;
  className?: string;
}

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({
  workflowId,
  onExecute,
  onCancel,
  className = ''
}) => {
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [currentExecution, setCurrentExecution] = useState<ExecutionLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch execution history
  const fetchExecutions = async () => {
    if (!workflowId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/execution/workflow/${workflowId}/history`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch execution statistics
  const fetchStats = async () => {
    if (!workflowId) return;
    
    try {
      const response = await fetch(`/api/execution/workflow/${workflowId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Check current execution status
  const checkCurrentExecution = async () => {
    const runningExecution = executions.find(ex => ex.status === 'running');
    if (runningExecution) {
      try {
        const response = await fetch(`/api/execution/${runningExecution.id}/status`);
        if (response.ok) {
          const data = await response.json();
          setCurrentExecution(data);
          
          // Update execution in list if status changed
          if (data.status !== 'running') {
            fetchExecutions();
            setCurrentExecution(null);
          }
        }
      } catch (error) {
        console.error('Failed to check execution status:', error);
      }
    }
  };

  useEffect(() => {
    if (workflowId) {
      fetchExecutions();
      fetchStats();
    }
  }, [workflowId]);

  useEffect(() => {
    // Poll for current execution updates
    const interval = setInterval(checkCurrentExecution, 2000);
    return () => clearInterval(interval);
  }, [executions]);

  const handleExecute = async () => {
    if (onExecute) {
      onExecute();
      // Refresh executions after a short delay to catch the new execution
      setTimeout(() => {
        fetchExecutions();
        fetchStats();
      }, 1000);
    }
  };

  const handleCancel = async (executionId: string) => {
    if (onCancel) {
      onCancel(executionId);
      setTimeout(() => {
        fetchExecutions();
        fetchStats();
      }, 1000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <ClockIcon className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Current Execution</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={handleExecute}
                  disabled={!!currentExecution}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <PlayIcon className="w-4 h-4" />
                  <span>Execute</span>
                </Button>
                {currentExecution && (
                  <Button
                    onClick={() => handleCancel(currentExecution.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <StopIcon className="w-4 h-4" />
                    <span>Cancel</span>
                  </Button>
                )}
              </div>
            </div>

            {currentExecution ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(currentExecution.status)}
                  <span className="font-medium capitalize">{currentExecution.status}</span>
                  <span className="text-sm text-gray-500">
                    Started at {formatTime(currentExecution.startTime)}
                  </span>
                </div>

                {currentExecution.nodeStatuses && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Node Progress:</h4>
                    <div className="space-y-1">
                      {Object.entries(currentExecution.nodeStatuses).map(([nodeId, status]) => (
                        <div key={nodeId} className="flex items-center space-x-2 text-sm">
                          {getStatusIcon(status.status)}
                          <span className="font-mono">{nodeId}</span>
                          <span className="capitalize">{status.status}</span>
                          {status.error && (
                            <span className="text-red-500 text-xs">({status.error})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentExecution.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-red-800 font-medium">Error:</div>
                    <div className="text-red-700 text-sm mt-1">{currentExecution.error}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No execution currently running</p>
                <p className="text-sm">Click Execute to start a new execution</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Execution History</h3>
            
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : executions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No executions yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {executions.slice(0, 50).map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {formatTime(execution.startTime)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {execution.trigger} trigger
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm">
                      {execution.duration && (
                        <div className="font-medium">
                          {formatDuration(execution.duration)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 capitalize">
                        {execution.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            
            {stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Total Executions</div>
                  <div className="text-2xl font-bold">{stats.totalExecutions}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Success Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {(stats.successRate * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Avg Duration</div>
                  <div className="text-2xl font-bold">
                    {formatDuration(stats.averageDuration)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Last 24h</div>
                  <div className="text-2xl font-bold">{stats.executions24h}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Successful</div>
                  <div className="text-lg font-semibold text-green-600">
                    {stats.successfulExecutions}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Failed</div>
                  <div className="text-lg font-semibold text-red-600">
                    {stats.failedExecutions}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Loading statistics...
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutionMonitor;
