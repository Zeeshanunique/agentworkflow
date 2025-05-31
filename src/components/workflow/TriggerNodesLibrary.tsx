import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { triggerDiscoveryService } from '../../services/triggerDiscovery';
import { useToast } from '../ui/use-toast';
import { useWorkflowStore } from '../../hooks/useWorkflowStore';

interface TriggerNodesLibraryProps {
  onAddNode?: (nodeType: string) => void;
}

const TriggerNodesLibrary: React.FC<TriggerNodesLibraryProps> = ({ onAddNode }) => {
  const [triggerNodes, setTriggerNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const addNode = useWorkflowStore(state => state.addNode);

  useEffect(() => {
    const loadTriggerNodes = async () => {
      setLoading(true);
      try {
        const nodes = await triggerDiscoveryService.discoverTriggerNodes();
        setTriggerNodes(nodes);
      } catch (error) {
        console.error('Failed to load trigger nodes', error);
        toast({
          title: 'Error',
          description: 'Failed to load available trigger nodes',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadTriggerNodes();
  }, [toast]);

  const handleAddNode = (nodeType: string) => {
    if (onAddNode) {
      onAddNode(nodeType);
    } else {
      // Default behavior: add node at the center of the canvas
      const node = triggerNodes.find(n => n.name === nodeType);
      if (node) {
        addNode({
          type: node.name,
          position: { x: 200, y: 200 },
          data: {
            label: node.displayName,
            description: node.description,
            icon: node.icon || 'fa:rocket',
            properties: node.properties || [],
            outputs: node.outputs || ['main'],
            parameters: {}
          }
        });
        
        toast({
          title: 'Success',
          description: `Added ${node.displayName} to workflow`,
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trigger Nodes</CardTitle>
        <CardDescription>Start your workflow with a trigger</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading trigger nodes...</div>
        ) : triggerNodes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No trigger nodes available</div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {triggerNodes.map((node) => (
                <div 
                  key={node.name} 
                  className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => handleAddNode(node.name)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center bg-green-100 text-green-800`}>
                      <i className={node.icon || 'fa fa-bolt'}></i>
                    </div>
                    <div>
                      <div className="font-medium">{node.displayName}</div>
                      <div className="text-xs text-muted-foreground">{node.subtitle || 'Trigger node'}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">Add</Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TriggerNodesLibrary;
