import { runQuery } from "../neo4j";
import { v4 as uuidv4 } from "uuid";
import { Node, Connection, Position } from "../../types";

/**
 * Create a new workflow in Neo4j
 */
export async function createWorkflow(
  userId: number,
  name: string,
  description: string = "",
  isPublic: boolean = false
) {
  const workflowId = uuidv4();
  const query = `
    CREATE (w:Workflow {
      id: $id,
      name: $name,
      description: $description,
      userId: $userId,
      isPublic: $isPublic,
      createdAt: datetime(),
      updatedAt: datetime()
    })
    RETURN w
  `;

  const params = {
    id: workflowId,
    name,
    description,
    userId: userId.toString(), // Convert to string for Neo4j
    isPublic
  };

  const result = await runQuery(query, params);
  return result[0]?.w.properties;
}

/**
 * Get a workflow by ID
 */
export async function getWorkflowById(workflowId: string) {
  const query = `
    MATCH (w:Workflow {id: $workflowId})
    RETURN w
  `;

  const result = await runQuery(query, { workflowId });
  return result[0]?.w.properties;
}

/**
 * Get all workflows for a user
 */
export async function getUserWorkflows(userId: number) {
  const query = `
    MATCH (w:Workflow {userId: $userId})
    RETURN w
    ORDER BY w.updatedAt DESC
  `;

  const result = await runQuery(query, { userId: userId.toString() });
  return result.map(row => row.w.properties);
}

/**
 * Add a node to a workflow
 */
export async function addNodeToWorkflow(
  workflowId: string,
  nodeType: string,
  position: Position,
  parameters: Record<string, any> = {}
) {
  const nodeId = uuidv4();
  const query = `
    MATCH (w:Workflow {id: $workflowId})
    CREATE (n:Node {
      id: $id,
      type: $nodeType,
      parameters: $parameters,
      position: $position,
      createdAt: datetime()
    })
    CREATE (w)-[:CONTAINS]->(n)
    RETURN n
  `;

  const params = {
    workflowId,
    id: nodeId,
    nodeType,
    parameters,
    position
  };

  const result = await runQuery(query, params);
  return result[0]?.n.properties;
}

/**
 * Update a node
 */
export async function updateNode(
  nodeId: string,
  updates: {
    parameters?: Record<string, any>;
    position?: Position;
  }
) {
  // Build dynamic update statement based on provided properties
  const setClauses = [];
  const params: Record<string, any> = { nodeId };

  if (updates.parameters) {
    setClauses.push("n.parameters = $parameters");
    params.parameters = updates.parameters;
  }

  if (updates.position) {
    setClauses.push("n.position = $position");
    params.position = updates.position;
  }

  // Add updated timestamp
  setClauses.push("n.updatedAt = datetime()");

  if (setClauses.length === 0) {
    return null; // Nothing to update
  }

  const query = `
    MATCH (n:Node {id: $nodeId})
    SET ${setClauses.join(", ")}
    RETURN n
  `;

  const result = await runQuery(query, params);
  return result[0]?.n.properties;
}

/**
 * Connect two nodes
 */
export async function connectNodes(
  fromNodeId: string,
  toNodeId: string,
  fromPortId: string,
  toPortId: string
) {
  const connectionId = uuidv4();
  const query = `
    MATCH (source:Node {id: $fromNodeId})
    MATCH (target:Node {id: $toNodeId})
    CREATE (source)-[c:CONNECTS_TO {
      id: $connectionId,
      fromPortId: $fromPortId,
      toPortId: $toPortId,
      createdAt: datetime()
    }]->(target)
    RETURN source, c, target
  `;

  const params = {
    fromNodeId,
    toNodeId,
    fromPortId,
    toPortId,
    connectionId
  };

  const result = await runQuery(query, params);
  
  if (result.length === 0) return null;
  
  return {
    id: connectionId,
    fromNodeId,
    fromPortId,
    toNodeId,
    toPortId
  };
}

/**
 * Get the complete workflow structure (nodes and connections)
 */
export async function getWorkflowStructure(workflowId: string) {
  const nodesQuery = `
    MATCH (w:Workflow {id: $workflowId})-[:CONTAINS]->(n:Node)
    RETURN n
  `;

  const connectionsQuery = `
    MATCH (w:Workflow {id: $workflowId})-[:CONTAINS]->(source:Node)-[c:CONNECTS_TO]->(target:Node)
    RETURN c, source.id AS fromNodeId, target.id AS toNodeId
  `;

  const [nodesResult, connectionsResult] = await Promise.all([
    runQuery(nodesQuery, { workflowId }),
    runQuery(connectionsQuery, { workflowId })
  ]);

  const nodes = nodesResult.map(row => {
    const node = row.n.properties;
    return {
      id: node.id,
      type: node.type,
      position: node.position,
      parameters: node.parameters || {}
    };
  });

  const connections = connectionsResult.map(row => {
    const conn = row.c.properties;
    return {
      id: conn.id,
      fromNodeId: row.fromNodeId,
      fromPortId: conn.fromPortId,
      toNodeId: row.toNodeId,
      toPortId: conn.toPortId
    };
  });

  return { nodes, connections };
}

/**
 * Delete a workflow and all its nodes and connections
 */
export async function deleteWorkflow(workflowId: string) {
  const query = `
    MATCH (w:Workflow {id: $workflowId})
    OPTIONAL MATCH (w)-[:CONTAINS]->(n:Node)
    OPTIONAL MATCH (n)-[c:CONNECTS_TO]->()
    DELETE c, n, w
    RETURN count(w) AS deleted
  `;

  const result = await runQuery(query, { workflowId });
  return result[0]?.deleted === 1;
}

/**
 * Save complete workflow (overwrite nodes and connections)
 */
export async function saveWorkflow(
  workflowId: string, 
  nodes: Node[], 
  connections: Connection[]
) {
  // First, delete existing nodes and connections
  const clearQuery = `
    MATCH (w:Workflow {id: $workflowId})
    OPTIONAL MATCH (w)-[:CONTAINS]->(n:Node)
    OPTIONAL MATCH (n)-[c:CONNECTS_TO]->()
    DELETE c, n
  `;
  
  await runQuery(clearQuery, { workflowId });
  
  // Create nodes
  for (const node of nodes) {
    await addNodeToWorkflow(
      workflowId,
      node.type,
      node.position,
      node.parameters
    );
  }
  
  // Create connections
  for (const conn of connections) {
    await connectNodes(
      conn.fromNodeId,
      conn.toNodeId,
      conn.fromPortId,
      conn.toPortId
    );
  }
  
  // Update workflow timestamp
  const updateQuery = `
    MATCH (w:Workflow {id: $workflowId})
    SET w.updatedAt = datetime()
    RETURN w
  `;
  
  const result = await runQuery(updateQuery, { workflowId });
  return result[0]?.w.properties;
} 