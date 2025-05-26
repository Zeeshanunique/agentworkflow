import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence, RunnableLambda } from "langchain/runnables";
import { 
  StateGraph, 
  END, 
  StateGraphArgs, 
  createFlow,
  StateValues,
  NodeEdge
} from "@langchain/langgraph";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getWorkflowStructure } from "../models/workflow";
import { initLangSmith } from "./langsmith";

// Ensure LangSmith tracking is initialized
initLangSmith();

// Configure the LLM
const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.7,
});

// Define the state type for our workflow
interface WorkflowState {
  messages: BaseMessage[];
  currentNodeId: string | null;
  executedNodes: string[];
  nodeOutputs: Record<string, any>;
  error?: string;
}

// Function to build a workflow graph from Neo4j nodes and connections
export async function buildWorkflowGraph(workflowId: string) {
  // Get workflow structure from Neo4j
  const { nodes, connections } = await getWorkflowStructure(workflowId);
  
  if (!nodes.length) {
    throw new Error("Workflow has no nodes");
  }
  
  // Find the start node (assuming it's a node with no incoming connections)
  const nodeIncomingConnections = new Map<string, number>();
  for (const node of nodes) {
    nodeIncomingConnections.set(node.id, 0);
  }
  
  for (const conn of connections) {
    const count = nodeIncomingConnections.get(conn.toNodeId) || 0;
    nodeIncomingConnections.set(conn.toNodeId, count + 1);
  }
  
  const startNodeId = [...nodeIncomingConnections.entries()]
    .find(([_, count]) => count === 0)?.[0];
  
  if (!startNodeId) {
    throw new Error("Cannot find a start node in the workflow");
  }
  
  // Initialize StateGraph for the workflow
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      messages: {
        value: (x: WorkflowState) => x.messages,
        default: () => [],
      },
      currentNodeId: {
        value: (x: WorkflowState) => x.currentNodeId,
        default: () => startNodeId,
      },
      executedNodes: {
        value: (x: WorkflowState) => x.executedNodes,
        default: () => [],
      },
      nodeOutputs: {
        value: (x: WorkflowState) => x.nodeOutputs,
        default: () => ({}),
      },
    },
  });
  
  // Create node execution functions
  for (const node of nodes) {
    workflow.addNode(node.id, createNodeExecutor(node));
  }
  
  // Add connections between nodes
  for (const connection of connections) {
    workflow.addEdge(connection.fromNodeId, connection.toNodeId);
  }
  
  // Define conditional edges
  for (const node of nodes) {
    // Check if this node has multiple outgoing connections
    const outgoingConnections = connections.filter(
      conn => conn.fromNodeId === node.id
    );
    
    if (outgoingConnections.length > 1) {
      workflow.addConditionalEdges(
        node.id,
        // This function determines which node to go to next
        (state: WorkflowState) => {
          const outputPort = state.nodeOutputs[node.id]?.outputPort || "default";
          
          // Find the connection that matches the output port
          const nextConnection = outgoingConnections.find(
            conn => conn.fromPortId === outputPort
          );
          
          return nextConnection?.toNodeId || END;
        }
      );
    } else if (outgoingConnections.length === 0) {
      // Terminal node - connect to END
      workflow.addEdge(node.id, END);
    }
    // Single outgoing connection is already handled by addEdge above
  }
  
  // Set the entry point
  workflow.setEntryPoint(startNodeId);
  
  // Compile the graph
  return workflow.compile();
}

// Create an executor function for a specific node
function createNodeExecutor(node: any) {
  // Different node types have different execution logic
  switch (node.type) {
    case "llm":
      return createLLMNodeExecutor(node);
    case "prompt":
      return createPromptNodeExecutor(node);
    case "code":
      return createCodeNodeExecutor(node);
    case "api":
      return createAPINodeExecutor(node);
    case "input":
      return createInputNodeExecutor(node);
    case "output":
      return createOutputNodeExecutor(node);
    case "conditional":
      return createConditionalNodeExecutor(node);
    case "transform":
      return createTransformNodeExecutor(node);
    default:
      return createGenericNodeExecutor(node);
  }
}

// LLM Node Executor
function createLLMNodeExecutor(node: any) {
  return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
    try {
      const systemPrompt = node.parameters?.systemPrompt || 
        "You are a helpful assistant.";
      
      const model = node.parameters?.model || "gpt-4o";
      const temperature = node.parameters?.temperature || 0.7;

      const llmNode = new ChatOpenAI({
        modelName: model,
        temperature: temperature,
      });

      const prompt = ChatPromptTemplate.fromMessages([
        ["system", systemPrompt],
        new MessagesPlaceholder("messages"),
      ]);

      const chain = RunnableSequence.from([
        prompt,
        llmNode,
        new StringOutputParser(),
      ]);

      const input = {
        messages: state.messages || [],
      };

      const result = await chain.invoke(input);

      return {
        messages: [...state.messages, new AIMessage(result)],
        currentNodeId: null,
        executedNodes: [...state.executedNodes, node.id],
        nodeOutputs: {
          ...state.nodeOutputs,
          [node.id]: { content: result, outputPort: "default" },
        },
      };
    } catch (error) {
      console.error(`Error executing LLM node (${node.id}):`, error);
      return {
        error: `Error in LLM node: ${(error as Error).message}`,
      };
    }
  };
}

// Prompt Node Executor
function createPromptNodeExecutor(node: any) {
  return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
    try {
      const promptTemplate = node.parameters?.template || "{{input}}";
      const inputVar = node.parameters?.inputVariable || "input";
      
      // Get input from previous node if specified
      const inputNodeId = node.parameters?.inputNodeId;
      let inputValue = "";
      
      if (inputNodeId && state.nodeOutputs[inputNodeId]) {
        inputValue = state.nodeOutputs[inputNodeId].content;
      }
      
      // Replace variables in the template
      let processedPrompt = promptTemplate.replace(
        new RegExp(`{{${inputVar}}}`, "g"), 
        inputValue
      );
      
      // Process any other variables from the global state
      const variableRegex = /{{([^{}]+)}}/g;
      let match;
      while ((match = variableRegex.exec(processedPrompt)) !== null) {
        const variable = match[1].trim();
        
        // Check if this variable comes from another node
        for (const [nodeId, output] of Object.entries(state.nodeOutputs)) {
          if (variable === nodeId || variable.startsWith(`${nodeId}.`)) {
            const propPath = variable.includes(".") 
              ? variable.split(".").slice(1).join(".")
              : "content";
            
            const value = getNestedProperty(output, propPath);
            if (value !== undefined) {
              processedPrompt = processedPrompt.replace(match[0], String(value));
            }
          }
        }
      }
      
      return {
        currentNodeId: null,
        executedNodes: [...state.executedNodes, node.id],
        nodeOutputs: {
          ...state.nodeOutputs,
          [node.id]: { content: processedPrompt, outputPort: "default" },
        },
      };
    } catch (error) {
      console.error(`Error executing Prompt node (${node.id}):`, error);
      return {
        error: `Error in Prompt node: ${(error as Error).message}`,
      };
    }
  };
}

// Code Node Executor
function createCodeNodeExecutor(node: any) {
  return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
    try {
      const code = node.parameters?.code || "";
      
      // Create a safe execution environment
      const sandboxFunction = new Function(
        "state", 
        "inputs",
        `
          try {
            ${code}
            return { result: __result, outputPort: "default" };
          } catch (error) {
            return { error: error.message, outputPort: "error" };
          }
        `
      );
      
      // Prepare inputs from other node outputs
      const inputs: Record<string, any> = {};
      
      if (node.parameters?.inputNodeIds) {
        for (const inputNodeId of node.parameters.inputNodeIds) {
          if (state.nodeOutputs[inputNodeId]) {
            inputs[inputNodeId] = state.nodeOutputs[inputNodeId].content;
          }
        }
      }
      
      // Execute the code
      const result = sandboxFunction(state, inputs);
      
      // Determine output port
      const outputPort = result.outputPort || "default";
      
      return {
        currentNodeId: null,
        executedNodes: [...state.executedNodes, node.id],
        nodeOutputs: {
          ...state.nodeOutputs,
          [node.id]: { 
            content: result.result, 
            error: result.error,
            outputPort 
          },
        },
      };
    } catch (error) {
      console.error(`Error executing Code node (${node.id}):`, error);
      return {
        error: `Error in Code node: ${(error as Error).message}`,
      };
    }
  };
}

// API Node Executor
function createAPINodeExecutor(node: any) {
  return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
    try {
      const url = node.parameters?.url || "";
      const method = node.parameters?.method || "GET";
      const headers = node.parameters?.headers || {};
      
      // Get body from input node if specified
      let body: any = node.parameters?.body || {};
      
      if (typeof body === "string" && body.startsWith("{{") && body.endsWith("}}")) {
        const nodeId = body.slice(2, -2).trim();
        if (state.nodeOutputs[nodeId]) {
          body = state.nodeOutputs[nodeId].content;
        }
      }
      
      // Make the API request
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: method !== "GET" ? JSON.stringify(body) : undefined,
      });
      
      let responseData;
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      // Determine output port based on response status
      const outputPort = response.ok ? "success" : "error";
      
      return {
        currentNodeId: null,
        executedNodes: [...state.executedNodes, node.id],
        nodeOutputs: {
          ...state.nodeOutputs,
          [node.id]: { 
            content: responseData, 
            status: response.status,
            outputPort,
          },
        },
      };
    } catch (error) {
      console.error(`Error executing API node (${node.id}):`, error);
      return {
        error: `Error in API node: ${(error as Error).message}`,
      };
    }
  };
}

// Input Node Executor
function createInputNodeExecutor(node: any) {
  return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
    try {
      // Input nodes just pass through the workflow input
      // The actual input is passed when invoking the workflow
      const input = state.messages[0]?.content || "";
      
      return {
        currentNodeId: null,
        executedNodes: [...state.executedNodes, node.id],
        nodeOutputs: {
          ...state.nodeOutputs,
          [node.id]: { content: input, outputPort: "default" },
        },
      };
    } catch (error) {
      console.error(`Error executing Input node (${node.id}):`, error);
      return {
        error: `Error in Input node: ${(error as Error).message}`,
      };
    }
  };
}

// Output Node Executor
function createOutputNodeExecutor(node: any) {
  return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
    try {
      // Get input from specified node
      const inputNodeId = node.parameters?.inputNodeId;
      let output = "";
      
      if (inputNodeId && state.nodeOutputs[inputNodeId]) {
        output = state.nodeOutputs[inputNodeId].content;
      }
      
      // Format output if needed
      const outputFormat = node.parameters?.format;
      if (outputFormat) {
        // Handle different output formats
        if (outputFormat === "json" && typeof output === "object") {
          output = JSON.stringify(output, null, 2);
        }
      }
      
      return {
        messages: [...state.messages, new AIMessage(String(output))],
        currentNodeId: null,
        executedNodes: [...state.executedNodes, node.id],
        nodeOutputs: {
          ...state.nodeOutputs,
          [node.id]: { content: output, outputPort: "default" },
        },
      };
    } catch (error) {
      console.error(`Error executing Output node (${node.id}):`, error);
      return {
        error: `Error in Output node: ${(error as Error).message}`,
      };
    }
  };
}

// Conditional Node Executor
function createConditionalNodeExecutor(node: any) {
  return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
    try {
      const conditions = node.parameters?.conditions || [];
      const inputNodeId = node.parameters?.inputNodeId;
      
      // Get input value
      let inputValue: any = null;
      if (inputNodeId && state.nodeOutputs[inputNodeId]) {
        inputValue = state.nodeOutputs[inputNodeId].content;
      }
      
      // Evaluate conditions
      let outputPort = "default";
      
      for (const condition of conditions) {
        const { operator, value, output } = condition;
        
        let conditionMet = false;
        
        switch (operator) {
          case "equals":
            conditionMet = inputValue == value;
            break;
          case "notEquals":
            conditionMet = inputValue != value;
            break;
          case "contains":
            conditionMet = String(inputValue).includes(String(value));
            break;
          case "greaterThan":
            conditionMet = Number(inputValue) > Number(value);
            break;
          case "lessThan":
            conditionMet = Number(inputValue) < Number(value);
            break;
          case "regex":
            conditionMet = new RegExp(String(value)).test(String(inputValue));
            break;
          default:
            conditionMet = false;
        }
        
        if (conditionMet) {
          outputPort = output;
          break;
        }
      }
      
      return {
        currentNodeId: null,
        executedNodes: [...state.executedNodes, node.id],
        nodeOutputs: {
          ...state.nodeOutputs,
          [node.id]: { 
            content: inputValue, 
            evaluatedCondition: outputPort,
            outputPort,
          },
        },
      };
    } catch (error) {
      console.error(`Error executing Conditional node (${node.id}):`, error);
      return {
        error: `Error in Conditional node: ${(error as Error).message}`,
      };
    }
  };
}

// Transform Node Executor
function createTransformNodeExecutor(node: any) {
  return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
    try {
      const transformType = node.parameters?.transformType || "json";
      const inputNodeId = node.parameters?.inputNodeId;
      
      // Get input value
      let inputValue: any = null;
      if (inputNodeId && state.nodeOutputs[inputNodeId]) {
        inputValue = state.nodeOutputs[inputNodeId].content;
      }
      
      let transformedValue;
      
      switch (transformType) {
        case "json":
          // Parse string to JSON
          if (typeof inputValue === "string") {
            transformedValue = JSON.parse(inputValue);
          } else {
            transformedValue = inputValue;
          }
          break;
        case "string":
          // Convert to string
          transformedValue = String(inputValue);
          break;
        case "number":
          // Convert to number
          transformedValue = Number(inputValue);
          break;
        case "boolean":
          // Convert to boolean
          transformedValue = Boolean(inputValue);
          break;
        case "custom":
          // Use custom transformation function
          const transformFn = node.parameters?.transformFunction;
          if (transformFn) {
            const fn = new Function("input", transformFn);
            transformedValue = fn(inputValue);
          } else {
            transformedValue = inputValue;
          }
          break;
        default:
          transformedValue = inputValue;
      }
      
      return {
        currentNodeId: null,
        executedNodes: [...state.executedNodes, node.id],
        nodeOutputs: {
          ...state.nodeOutputs,
          [node.id]: { content: transformedValue, outputPort: "default" },
        },
      };
    } catch (error) {
      console.error(`Error executing Transform node (${node.id}):`, error);
      return {
        error: `Error in Transform node: ${(error as Error).message}`,
      };
    }
  };
}

// Generic Node Executor (fallback for custom nodes)
function createGenericNodeExecutor(node: any) {
  return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
    // Simple pass-through for unknown node types
    return {
      currentNodeId: null,
      executedNodes: [...state.executedNodes, node.id],
      nodeOutputs: {
        ...state.nodeOutputs,
        [node.id]: { content: "Executed generic node", outputPort: "default" },
      },
    };
  };
}

// Helper function to get nested property from an object
function getNestedProperty(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  const parts = path.split(".");
  let current = obj;
  
  for (const part of parts) {
    if (current[part] === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

// Function to execute a workflow with input
export async function executeWorkflow(workflowId: string, input: string) {
  try {
    // Build the workflow graph
    const graph = await buildWorkflowGraph(workflowId);
    
    // Execute the workflow
    const result = await graph.invoke({
      messages: [new HumanMessage(input)],
      currentNodeId: null,
      executedNodes: [],
      nodeOutputs: {},
    });
    
    return {
      success: true,
      result: result,
      error: null,
    };
  } catch (error) {
    console.error("Workflow execution error:", error);
    return {
      success: false,
      result: null,
      error: (error as Error).message,
    };
  }
} 