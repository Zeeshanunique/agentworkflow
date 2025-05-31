import React, { useState } from 'react';
import { TriggerStatistics, TriggerNodesLibrary } from '../../components/workflow';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { executeManualTrigger } from '../../lib/triggerWorkflowIntegration';
import { useToast } from '../../components/ui/use-toast';

const N8nTriggersDemo = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('demo-workflow');
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Example workflows with trigger nodes
  const demoWorkflows = [
    {
      id: 'demo-workflow',
      name: 'Manual Trigger Demo',
      description: 'Simple workflow with manual trigger',
      triggerType: 'manual'
    },
    {
      id: 'webhook-workflow',
      name: 'Webhook Demo',
      description: 'API webhook triggered workflow',
      triggerType: 'webhook'
    },
    {
      id: 'schedule-workflow',
      name: 'Scheduled Demo',
      description: 'Runs every hour on schedule',
      triggerType: 'schedule'
    }
  ];

  const handleExecuteManualTrigger = async (workflowId: string) => {
    setLoading(true);
    try {
      const result = await executeManualTrigger(
        workflowId,
        'node-1',  // Using a standard node ID for the demo
        {
          source: 'demo-page',
          timestamp: new Date().toISOString(),
          params: {
            demo: true,
            user: 'admin'
          }
        }
      );

      if (result.triggered) {
        toast({
          title: 'Success',
          description: 'Manual trigger executed successfully!',
        });
      } else {
        toast({
          title: 'Failed to execute',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute trigger',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">N8n Trigger Nodes</h1>
        <p className="text-muted-foreground">
          Complete implementation of n8n-style trigger nodes with proper polling, webhook handling, and execution patterns.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <TriggerStatistics />
        </div>
        <div>
          <TriggerNodesLibrary />
        </div>
      </div>

      <Tabs defaultValue="demo">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="demo">Demo Workflows</TabsTrigger>
          <TabsTrigger value="manual">Manual Execution</TabsTrigger>
          <TabsTrigger value="statistics">Trigger Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Demo Workflows</CardTitle>
              <CardDescription>Sample workflows with different trigger types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoWorkflows.map((workflow) => (
                  <Card key={workflow.id}>
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <CardDescription>{workflow.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="py-2 flex justify-between">
                      <div className="flex items-center">
                        <span className="text-sm">Trigger Type: </span>
                        <span className="ml-2 inline-flex h-5 items-center rounded-md bg-blue-50 px-2 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
                          {workflow.triggerType}
                        </span>
                      </div>
                      {workflow.triggerType === 'manual' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleExecuteManualTrigger(workflow.id)}
                          disabled={loading}
                        >
                          Execute
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Trigger Execution</CardTitle>
              <CardDescription>Manually trigger workflows for testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium">Select Workflow</label>
                    <select 
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedWorkflow}
                      onChange={(e) => setSelectedWorkflow(e.target.value)}
                    >
                      {demoWorkflows.map((wf) => (
                        <option key={wf.id} value={wf.id}>{wf.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleExecuteManualTrigger(selectedWorkflow)}
                disabled={loading}
              >
                {loading ? 'Executing...' : 'Execute Manual Trigger'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Trigger Node Overview</CardTitle>
              <CardDescription>Implemented n8n-style trigger nodes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div className="col-span-2">
                    <h3 className="font-medium mb-2">Manual Trigger</h3>
                    <p className="text-sm text-muted-foreground">
                      Follows n8n's INodeType architecture exactly for manual workflow execution with custom data
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Webhook Trigger</h3>
                    <p className="text-sm text-muted-foreground">
                      Implements proper webhook handling with authentication options and HTTP methods
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Schedule Trigger</h3>
                    <p className="text-sm text-muted-foreground">
                      Uses polling architecture with cron-style scheduling and timezone support
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Email Trigger</h3>
                    <p className="text-sm text-muted-foreground">
                      Implements IMAP polling pattern with mailbox configuration and attachment handling
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default N8nTriggersDemo;
