import { Node, Connection } from "../types";

/**
 * Sort nodes in topological order for execution
 */
function topologicalSort(nodes: Node[], connections: Connection[]): Node[] {
  const nodeMap = new Map<string, Node>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Create adjacency list
  const graph: Record<string, string[]> = {};
  nodes.forEach((node) => (graph[node.id] = []));

  // Build dependencies
  connections.forEach((conn) => {
    const fromNodeId = conn.fromNodeId;
    const toNodeId = conn.toNodeId;

    if (graph[toNodeId]) {
      graph[toNodeId].push(fromNodeId);
    }
  });

  // Keeps track of visited nodes
  const visited = new Set<string>();
  const temp = new Set<string>();
  const result: Node[] = [];

  function visit(nodeId: string): boolean {
    if (temp.has(nodeId)) {
      // Circular dependency detected
      return false;
    }

    if (visited.has(nodeId)) {
      return true;
    }

    temp.add(nodeId);

    // Visit all dependencies
    for (const dependency of graph[nodeId] || []) {
      if (!visit(dependency)) {
        return false;
      }
    }

    temp.delete(nodeId);
    visited.add(nodeId);

    // Add node to result if it exists
    const node = nodeMap.get(nodeId);
    if (node) {
      result.push(node);
    }

    return true;
  }

  // Visit all nodes
  for (const node of nodes) {
    if (!visit(node.id)) {
      // If circular dependency is detected, return nodes in original order
      console.error("Circular dependency detected in workflow");
      return nodes;
    }
  }

  // Reverse to get correct execution order
  return result.reverse();
}

/**
 * Execute a specific node based on its type and parameters
 */
async function executeNode(
  node: Node,
  inputData: Record<string, any>,
): Promise<Record<string, any>> {
  console.log(`Executing node: ${node.data?.name || node.id} (${node.data?.nodeType?.type || node.type})`, {
    inputs: inputData,
    parameters: node.parameters,
  });

  // Check if node has necessary configuration
  if (!node.parameters || Object.keys(node.parameters).length === 0) {
    throw new Error(
      `Node ${node.data?.name || node.id} is not configured properly. Please add required parameters.`,
    );
  }

  // Output data object
  const outputData: Record<string, any> = {};

  try {
    // Execute based on node type
    switch (node.data?.nodeType?.type || node.type) {
      case "openai_assistant":
        if (!node.parameters.apiKey) {
          throw new Error("OpenAI API key is required");
        }

        // Mock OpenAI API call for now
        outputData.response = `Generated content for: ${inputData.prompt || "No prompt provided"}`;
        outputData.success = true;
        break;

      case "email_sender":
        if (!node.parameters.apiKey) {
          throw new Error("Email service API key is required");
        }

        // Mock email sending
        outputData.sent = true;
        outputData.messageId = `email_${Date.now()}`;
        break;

      case "campaign_scheduler":
        // Mock campaign scheduling
        outputData.scheduled = true;
        outputData.campaignId = `campaign_${Date.now()}`;
        break;

      case "ad_generator":
        // Mock ad generation
        outputData.adContent = `Generated ad for: ${inputData.product || "Unknown product"}`;
        outputData.adId = `ad_${Date.now()}`;
        break;

      case "marketing_analytics":
        // Mock analytics data
        outputData.metrics = {
          impressions: Math.floor(Math.random() * 10000),
          clicks: Math.floor(Math.random() * 1000),
          conversions: Math.floor(Math.random() * 100),
          roi: (Math.random() * 5 + 1).toFixed(2),
        };
        break;

      case "sms_sender":
        if (!node.parameters.apiKey) {
          throw new Error("SMS service API key is required");
        }

        // Mock SMS sending
        outputData.sent = true;
        outputData.messageId = `sms_${Date.now()}`;
        break;

      case "api_request":
        if (!node.parameters.url) {
          throw new Error("API URL is required");
        }

        // Mock API request
        outputData.response = {
          status: "success",
          data: { result: "API response data" },
        };
        break;

      case "webhook":
        // Mock webhook receiver
        outputData.payload = inputData.payload || {
          event: "webhook_triggered",
          timestamp: Date.now(),
        };
        break;

      case "conditional":
        // Process conditional logic
        const condition = Boolean(inputData.condition);
        if (condition) {
          outputData.true = inputData;
        } else {
          outputData.false = inputData;
        }
        break;

      case "filter":
        // Mock filter operation
        const property = node.parameters.property || "";
        const operator = node.parameters.operator || "equals";
        const value = node.parameters.value || "";

        // Assume inputData.data is an array
        if (Array.isArray(inputData.data)) {
          outputData.filtered = inputData.data.filter((item: any) => {
            if (!property || !item) return true;

            const itemValue = item[property];

            switch (operator) {
              case "equals":
                return itemValue === value;
              case "not_equals":
                return itemValue !== value;
              case "contains":
                return String(itemValue).includes(value);
              case "greater_than":
                return Number(itemValue) > Number(value);
              case "less_than":
                return Number(itemValue) < Number(value);
              default:
                return true;
            }
          });
        } else {
          outputData.filtered = [];
        }
        break;

      default:
        // For other node types
        outputData.processed = true;
        outputData.data = inputData;
    }

    return outputData;
  } catch (error) {
    console.error(`Error executing node ${node.data?.name || node.id}:`, error);
    throw error;
  }
}

/**
 * Get input data for a node based on its connections
 */
function getNodeInputData(
  node: Node,
  connections: Connection[],
  nodeResults: Map<string, Record<string, any>>,
): Record<string, any> {
  const inputData: Record<string, any> = {};

  // Find all connections where this node is the target
  const incomingConnections = connections.filter(
    (conn) => conn.toNodeId === node.id,
  );

  // For each incoming connection, get the output from the source node
  incomingConnections.forEach((conn) => {
    const sourceNodeId = conn.fromNodeId;
    const sourcePortId = conn.fromPortId;
    const targetPortId = conn.toPortId;

    // Get the output data from the source node
    const sourceNodeOutput = nodeResults.get(sourceNodeId) || {};

    // Map to the appropriate input
    if (sourceNodeOutput[sourcePortId] !== undefined) {
      inputData[targetPortId] = sourceNodeOutput[sourcePortId];
    } else if (Object.keys(sourceNodeOutput).length > 0) {
      // If specific port not found but node has output, use the entire output
      inputData[targetPortId] = sourceNodeOutput;
    }
  });

  return inputData;
}

/**
 * Execute the entire workflow
 */
export async function executeWorkflow(
  nodes: Node[],
  connections: Connection[],
): Promise<{ success: boolean; results: Record<string, any>; error?: string }> {
  try {
    // Sort nodes for execution
    const sortedNodes = topologicalSort(nodes, connections);

    // Results for each node
    const nodeResults = new Map<string, Record<string, any>>();

    // Execute nodes in order
    for (const node of sortedNodes) {
      try {
        // Get input data for this node
        const inputData = getNodeInputData(node, connections, nodeResults);

        // Execute the node
        const outputData = await executeNode(node, inputData);

        // Store the result
        nodeResults.set(node.id, outputData);
      } catch (error: any) {
        console.error(`Error in node ${node.data?.name || node.id}:`, error);
        return {
          success: false,
          results: Object.fromEntries(nodeResults.entries()),
          error: `Error in node "${node.data?.name || node.id}": ${error.message}`,
        };
      }
    }

    return {
      success: true,
      results: Object.fromEntries(nodeResults.entries()),
    };
  } catch (error: any) {
    console.error("Error executing workflow:", error);
    return {
      success: false,
      results: {},
      error: `Error executing workflow: ${error.message}`,
    };
  }
}
