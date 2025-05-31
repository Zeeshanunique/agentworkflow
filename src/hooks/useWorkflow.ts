import { useState, useCallback } from "react";
import { Node, Edge, Position } from "../types/workflow";
import { v4 as uuidv4 } from "uuid";
import { getN8nNodeTypeByType } from "../data/n8nNodeTypes";
import { getNodeDescription, createNodeInstance } from "../data/n8nNodeRegistry";
import { createWorkflowExecutor, IWorkflowExecutionContext, IExecutionResult } from "../utils/n8nWorkflowExecutor";
import OpenAI from "openai";

interface UseWorkflowReturn {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedNode: Node | null;
  isRunning: boolean;
  addNode: (type: string, position: Position) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  moveNode: (nodeId: string, position: Position) => void;
  addEdge: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => void;
  deleteEdge: (edgeId: string) => void;
  clearWorkflow: () => void;
  runWorkflow: () => void;
}

export function useWorkflow(): UseWorkflowReturn {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const selectedNode = selectedNodeId
    ? nodes.find((node) => node.id === selectedNodeId) ?? null
    : null;

  const addNode = useCallback(
    (type: string, position: Position) => {
      const nodeType = getN8nNodeTypeByType(type);
      if (!nodeType) return;

      const newNode: Node = {
        id: uuidv4(),
        name: nodeType.name,
        type: type,
        description: nodeType.description,
        position,
        inputs: nodeType.inputs,
        outputs: nodeType.outputs,
        parameters: nodeType.defaultParameters || {}
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newNode.id);

      return newNode.id;
    },
    [],
  );

  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
    );
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const moveNode = useCallback((nodeId: string, position: Position) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, position } : node)),
    );
  }, []);

  const addEdge = useCallback((sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => {
    if (sourceNodeId === targetNodeId) return;

    const existingEdge = edges.find(
      (edge) =>
        edge.source === sourceNodeId &&
        edge.sourcePort === sourcePortId &&
        edge.target === targetNodeId &&
        edge.targetPort === targetPortId
    );

    if (existingEdge) return;

    const newEdge: Edge = {
      id: uuidv4(),
      source: sourceNodeId,
      sourcePort: sourcePortId,
      target: targetNodeId,
      targetPort: targetPortId
    };
    setEdges((prev) => [...prev, newEdge]);
  }, [edges]);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
  }, []);

  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, []);

  const getNodeValue = async (nodeId: string): Promise<any> => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    // Get input values
    const inputValues: Record<string, any> = {};
    for (const input of node.inputs) {
      const connection = edges.find(
        (c) => c.target === nodeId && c.targetPort === input.id,
      );
      if (connection) {
        inputValues[input.id] = await getNodeValue(connection.source);
      }
    }

    // Get node type
    const nodeType = getN8nNodeTypeByType(node.type);
    if (!nodeType) return null;

    // Process node based on type
    switch (nodeType.type) {
      case "openai_key":
        return node.parameters?.apiKey;

      case "ai_message":
        const apiKey = await getApiKey();
        if (!apiKey) throw new Error("OpenAI API key not configured");

        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: inputValues.prompt }],
          model: node.parameters?.model || "gpt-4",
        });
        return completion.choices[0].message.content;

      case "image_generator":
        const imgApiKey = await getApiKey();
        if (!imgApiKey) throw new Error("OpenAI API key not configured");

        const imgOpenai = new OpenAI({ apiKey: imgApiKey });
        const image = await imgOpenai.images.generate({
          prompt: inputValues.prompt,
          model: node.parameters?.model || "dall-e-3",
          size: node.parameters?.size || "1024x1024",
        });
        return image.data?.[0]?.url;

      // Add more node type handlers here

      default:
        return null;
    }
  };

  const getApiKey = async (): Promise<string | null> => {
    const keyNode = nodes.find((n) => {
      const nodeType = getN8nNodeTypeByType(n.type);
      return nodeType?.type === "openai_key";
    });
    return keyNode?.parameters?.apiKey || null;
  };

  const runWorkflow = useCallback(async () => {
    setIsRunning(true);
    try {
      // Convert workflow types to n8n format
      const n8nNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        parameters: node.parameters,
        data: {
          name: node.name,
          description: node.description,
          inputs: node.inputs,
          outputs: node.outputs
        }
      }));

      const n8nConnections = edges.map(edge => ({
        id: edge.id,
        fromNodeId: edge.source,
        fromPortId: edge.sourcePort,
        toNodeId: edge.target,
        toPortId: edge.targetPort
      }));

      // Create execution context
      const executionContext: IWorkflowExecutionContext = {
        executionId: `exec_${Date.now()}`,
        mode: 'manual',
        startTime: new Date(),
        variables: {},
        credentials: {
          // Add any credentials here
          openai: {
            apiKey: await getApiKey()
          }
        }
      };

      // Execute workflow using n8n-style executor
      const executor = createWorkflowExecutor(executionContext);
      executor.loadWorkflow(n8nNodes, n8nConnections);
      
      const result: IExecutionResult = await executor.executeWorkflow();
      
      if (result.success) {
        console.log('Workflow executed successfully:', result);
        // Handle successful execution
        if (result.nodeResults) {
          for (const [nodeId, nodeData] of result.nodeResults) {
            console.log(`Node ${nodeId} result:`, nodeData);
            // Update node status or handle results as needed
          }
        }
      } else {
        console.error('Workflow execution failed:', result.error);
        throw new Error(result.error);
      }

    } catch (error) {
      console.error("Workflow execution error:", error);
    } finally {
      setIsRunning(false);
    }
  }, [nodes, edges]);

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    isRunning,
    addNode,
    updateNode,
    deleteNode,
    selectNode,
    moveNode,
    addEdge,
    deleteEdge,
    clearWorkflow,
    runWorkflow,
  };
}
