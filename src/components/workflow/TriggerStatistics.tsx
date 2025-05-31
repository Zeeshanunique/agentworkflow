import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { getTriggerStatistics, executeManualTrigger } from '../../lib/triggerWorkflowIntegration';
import { useToast } from '../ui/use-toast';

interface TriggerStatistics {
  totalTriggers: number;
  triggersByType: Record<string, number>;
  pollingTriggers: number;
}

const TriggerStatistics: React.FC = () => {
  const [stats, setStats] = useState<TriggerStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const statistics = await getTriggerStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load trigger statistics', error);
      toast({
        title: 'Error',
        description: 'Failed to load trigger statistics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

    // Poll for updated stats every 30 seconds
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualTrigger = async (workflowId: string, nodeId: string) => {
    setExecuting(true);
    try {
      const result = await executeManualTrigger(workflowId, nodeId, {
        triggered: 'ui',
        timestamp: new Date().toISOString()
      });

      if (result.triggered) {
        toast({
          title: 'Success',
          description: 'Manual trigger executed successfully',
        });
      } else {
        toast({
          title: 'Warning',
          description: `Trigger failed: ${result.error || 'Unknown error'}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to execute manual trigger', error);
      toast({
        title: 'Error',
        description: 'Failed to execute manual trigger',
        variant: 'destructive'
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>N8n Trigger Nodes</CardTitle>
        <CardDescription>Active trigger nodes in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading trigger statistics...</div>
        ) : !stats ? (
          <div className="text-center py-4 text-muted-foreground">No trigger data available</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.totalTriggers}</div>
                <div className="text-sm text-muted-foreground">Active Triggers</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.pollingTriggers}</div>
                <div className="text-sm text-muted-foreground">Polling Triggers</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Trigger Types</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.triggersByType).map(([type, count]) => (
                  <Badge key={type} variant="outline">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={fetchStatistics} disabled={loading}>
          Refresh Statistics
        </Button>
        
        <Button 
          onClick={() => handleManualTrigger('demo-workflow', 'manual-trigger')} 
          disabled={executing || loading}
        >
          Test Manual Trigger
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TriggerStatistics;
