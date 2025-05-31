import React, { useState } from 'react';
import { MainLayout } from '../../components/layout';
import ExecutionPanel from '../../components/ExecutionPanel';
import ExecutionMonitor from '../../components/ExecutionMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';

interface ExecutionDashboardProps {
  username?: string;
}

export default function ExecutionDashboard({ username }: ExecutionDashboardProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  const handleExecute = async () => {
    if (!selectedWorkflowId) return;
    
    try {
      const response = await fetch(`/api/execution/workflow/${selectedWorkflowId}/execute`, {
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
        console.log('Workflow execution started');
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  const handleCancel = async (executionId: string) => {
    try {
      const response = await fetch(`/api/execution/${executionId}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        console.log('Execution cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  };

  return (
    <MainLayout username={username}>
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Execution Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage workflow executions
          </p>
        </div>

        <Tabs defaultValue="executions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="executions">Executions</TabsTrigger>
            <TabsTrigger value="monitoring">Real-time Monitor</TabsTrigger>
            <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          </TabsList>

          <TabsContent value="executions" className="space-y-4">
            <ExecutionPanel />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Workflow Selection</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Monitor Workflow:
                    </label>
                    <input
                      type="text"
                      placeholder="Enter workflow ID"
                      value={selectedWorkflowId}
                      onChange={(e) => setSelectedWorkflowId(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Enter a workflow ID to monitor its execution in real-time
                  </p>
                </div>
              </Card>

              <ExecutionMonitor
                workflowId={selectedWorkflowId}
                onExecute={handleExecute}
                onCancel={handleCancel}
              />
            </div>
          </TabsContent>

          <TabsContent value="scheduler" className="space-y-4">
            <SchedulerPanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// Scheduler Panel Component
const SchedulerPanel: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/execution/scheduler/jobs');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshScheduler = async () => {
    try {
      const response = await fetch('/api/execution/scheduler/refresh', {
        method: 'POST'
      });
      if (response.ok) {
        console.log('Scheduler refreshed');
        fetchSchedules();
      }
    } catch (error) {
      console.error('Failed to refresh scheduler:', error);
    }
  };

  React.useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Scheduled Workflows</h2>
        <div className="space-x-2">
          <button
            onClick={fetchSchedules}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={refreshScheduler}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Refresh Scheduler
          </button>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No scheduled workflows found</p>
          <p className="text-sm">Workflows with cron triggers will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{schedule.workflowId}</h3>
                <p className="text-sm text-gray-600">Schedule: {schedule.schedule}</p>
                <p className="text-sm text-gray-500">
                  Next run: {schedule.nextRun || 'Not available'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  schedule.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {schedule.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
