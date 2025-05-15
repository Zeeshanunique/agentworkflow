import { useState, useCallback } from 'react';
import { Node, Connection, Position, NodeType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getNodeTypeByType } from '../data/nodeTypes';
import OpenAI from 'openai';

export const useWorkflow = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const selectedNode = selectedNodeId 
    ? nodes.find(node => node.id === selectedNodeId) 
    : null;

  const addNode = useCallback((nodeType: string, position: Position = { x: 100, y: 100 }) => {
    const nodeTypeData = getNodeTypeByType(nodeType);
    if (!nodeTypeData) return;

    const newNode: Node = {
      id: uuidv4(),
      name: nodeTypeData.name,
      description: nodeTypeData.description,
      position,
      nodeType: nodeTypeData,
      inputs: nodeTypeData.inputs,
      outputs: nodeTypeData.outputs,
      parameters: nodeTypeData.defaultParameters ? { ...nodeTypeData.defaultParameters } : {}
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    
    return newNode.id;
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes(prev => 
      prev.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  }, []);

  const moveNode = useCallback((nodeId: string, position: Position) => {
    setNodes(prev => 
      prev.map(node => 
        node.id === nodeId ? { ...node, position } : node
      )
    );
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    
    // Remove connections associated with this node
    setConnections(prev => 
      prev.filter(conn => 
        conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
      )
    );

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const connectNodes = useCallback((fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => {
    // Prevent connecting a node to itself
    if (fromNodeId === toNodeId) return;
    
    // Prevent duplicate connections
    const existingConnection = connections.find(conn => 
      conn.fromNodeId === fromNodeId && 
      conn.fromPortId === fromPortId && 
      conn.toNodeId === toNodeId && 
      conn.toPortId === toPortId
    );
    
    if (existingConnection) return;
    
    const newConnection: Connection = {
      id: uuidv4(),
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId
    };
    
    setConnections(prev => [...prev, newConnection]);
  }, [connections]);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => 
      prev.filter(conn => conn.id !== connectionId)
    );
  }, []);

  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
  }, []);

  const getNodeValue = async (nodeId: string): Promise<any> => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    // Get input values
    const inputValues: Record<string, any> = {};
    for (const input of node.inputs) {
      const connection = connections.find(c => c.toNodeId === nodeId && c.toPortId === input.id);
      if (connection) {
        inputValues[input.id] = await getNodeValue(connection.fromNodeId);
      }
    }

    // Process node based on type
    switch (node.nodeType.type) {
      case 'openai_key':
        return node.parameters?.apiKey;

      case 'ai_message':
        const apiKey = await getApiKey();
        if (!apiKey) throw new Error('OpenAI API key not configured');

        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: inputValues.prompt }],
          model: node.parameters?.model || 'gpt-4',
        });
        return completion.choices[0].message.content;

      case 'image_generator':
        const imgApiKey = await getApiKey();
        if (!imgApiKey) throw new Error('OpenAI API key not configured');

        const imgOpenai = new OpenAI({ apiKey: imgApiKey });
        const image = await imgOpenai.images.generate({
          prompt: inputValues.prompt,
          model: node.parameters?.model || 'dall-e-3',
          size: node.parameters?.size || '1024x1024',
        });
        return image.data[0].url;

      // Add more node type handlers here
      
      default:
        return null;
    }
  };

  const getApiKey = async (): Promise<string | null> => {
    const keyNode = nodes.find(n => n.nodeType.type === 'openai_key');
    return keyNode?.parameters?.apiKey || null;
  };

  const runWorkflow = useCallback(async () => {
    setIsRunning(true);
    try {
      // Find output nodes (nodes with no outgoing connections)
      const outputNodes = nodes.filter(node => 
        !connections.some(conn => conn.fromNodeId === node.id)
      );

      // Execute each output node
      for (const node of outputNodes) {
        await getNodeValue(node.id);
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
    } finally {
      setIsRunning(false);
    }
  }, [nodes, connections]);

  return {
    nodes,
    connections,
    selectedNodeId,
    selectedNode,
    isRunning,
    addNode,
    updateNode,
    moveNode,
    removeNode,
    connectNodes,
    removeConnection,
    clearWorkflow,
    runWorkflow,
    setSelectedNodeId
  };
};