import { WebSocketServer, WebSocket } from "ws";
import { nanoid } from "nanoid";

interface Client {
  id: string;
  ws: WebSocket;
  workflowId: string | null;
}

interface WorkflowRoom {
  clients: Map<string, Client>;
}

// Store rooms by workflow ID
const rooms = new Map<string, WorkflowRoom>();

// Store clients by their ID
const clients = new Map<string, Client>();

// Message types
const MESSAGE_TYPES = {
  JOIN_WORKFLOW: "JOIN_WORKFLOW",
  LEAVE_WORKFLOW: "LEAVE_WORKFLOW",
  UPDATE_NODE: "UPDATE_NODE",
  ADD_NODE: "ADD_NODE",
  DELETE_NODE: "DELETE_NODE",
  UPDATE_CONNECTION: "UPDATE_CONNECTION",
  ADD_CONNECTION: "ADD_CONNECTION",
  DELETE_CONNECTION: "DELETE_CONNECTION",
  CLIENT_JOINED: "CLIENT_JOINED",
  CLIENT_LEFT: "CLIENT_LEFT"
};

export function setupWebSocketServer(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket) => {
    // Create a new client with a unique ID
    const clientId = nanoid();
    const client: Client = {
      id: clientId,
      ws,
      workflowId: null
    };
    
    // Add the client to our map
    clients.set(clientId, client);
    
    // Send client their ID
    ws.send(JSON.stringify({
      type: "CONNECTED",
      clientId
    }));
    
    // Handle messages from client
    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        handleMessage(client, data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    });
    
    // Handle client disconnection
    ws.on("close", () => {
      handleClientDisconnect(client);
    });
  });
}

function handleMessage(client: Client, data: any) {
  const { type } = data;
  
  switch (type) {
    case MESSAGE_TYPES.JOIN_WORKFLOW:
      handleJoinWorkflow(client, data.workflowId);
      break;
      
    case MESSAGE_TYPES.LEAVE_WORKFLOW:
      handleLeaveWorkflow(client);
      break;
      
    case MESSAGE_TYPES.UPDATE_NODE:
    case MESSAGE_TYPES.ADD_NODE:
    case MESSAGE_TYPES.DELETE_NODE:
    case MESSAGE_TYPES.UPDATE_CONNECTION:
    case MESSAGE_TYPES.ADD_CONNECTION:
    case MESSAGE_TYPES.DELETE_CONNECTION:
      // Forward the action to all other clients in the same room
      broadcastToRoom(client, data);
      break;
      
    default:
      console.warn(`Unknown message type: ${type}`);
  }
}

function handleJoinWorkflow(client: Client, workflowId: string) {
  // Leave current workflow if in one
  if (client.workflowId) {
    handleLeaveWorkflow(client);
  }
  
  // Get or create the room
  let room = rooms.get(workflowId);
  if (!room) {
    room = { clients: new Map() };
    rooms.set(workflowId, room);
  }
  
  // Add client to the room
  room.clients.set(client.id, client);
  
  // Update client state
  client.workflowId = workflowId;
  
  // Notify other clients in the room
  broadcastToRoom(client, {
    type: MESSAGE_TYPES.CLIENT_JOINED,
    clientId: client.id
  });
  
  // Send confirmation to client
  client.ws.send(JSON.stringify({
    type: "JOINED_WORKFLOW",
    workflowId,
    clientCount: room.clients.size
  }));
}

function handleLeaveWorkflow(client: Client) {
  if (!client.workflowId) return;
  
  const room = rooms.get(client.workflowId);
  if (room) {
    // Remove client from room
    room.clients.delete(client.id);
    
    // Notify other clients
    broadcastToRoom(client, {
      type: MESSAGE_TYPES.CLIENT_LEFT,
      clientId: client.id
    });
    
    // If room is empty, delete it
    if (room.clients.size === 0) {
      rooms.delete(client.workflowId);
    }
  }
  
  // Update client state
  client.workflowId = null;
}

function handleClientDisconnect(client: Client) {
  // Leave any workflow room
  if (client.workflowId) {
    handleLeaveWorkflow(client);
  }
  
  // Remove from clients map
  clients.delete(client.id);
}

function broadcastToRoom(sender: Client, data: any) {
  if (!sender.workflowId) return;
  
  const room = rooms.get(sender.workflowId);
  if (!room) return;
  
  // Add sender ID to the message
  const message = JSON.stringify({
    ...data,
    senderId: sender.id
  });
  
  // Send to all clients except the sender
  room.clients.forEach(client => {
    if (client.id !== sender.id && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}
