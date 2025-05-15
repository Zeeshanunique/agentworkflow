import { useEffect, useRef, useState } from 'react';
import { useWorkflowStore } from '../hooks/useWorkflowStore';

// Define message types
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocketConnection(workflowId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  // Get workflow actions from store
  const {
    updateNode,
    addNode,
    deleteNode,
    moveNode,
    addConnection,
    deleteConnection
  } = useWorkflowStore();

  useEffect(() => {
    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Don't connect if no workflow ID
    if (!workflowId) {
      setIsConnected(false);
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setClientId(null);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      // Clean up on unmount or when workflowId changes
      socket.close();
    };
  }, [workflowId]);

  // Handle incoming WebSocket messages
  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'CONNECTED':
        setClientId(message.clientId);
        setIsConnected(true);
        
        // Join workflow room if we have a workflow ID
        if (workflowId && socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'JOIN_WORKFLOW',
            workflowId
          }));
        }
        break;
        
      case 'JOINED_WORKFLOW':
        console.log(`Joined workflow room for: ${message.workflowId}`);
        console.log(`${message.clientCount} clients in room`);
        break;
        
      case 'CLIENT_JOINED':
        console.log(`Client joined: ${message.clientId}`);
        setActiveUsers((users) => [...users, message.clientId]);
        break;
        
      case 'CLIENT_LEFT':
        console.log(`Client left: ${message.clientId}`);
        setActiveUsers((users) => users.filter(id => id !== message.clientId));
        break;
        
      case 'UPDATE_NODE':
        if (message.senderId !== clientId) {
          updateNode(message.nodeId, message.updates);
        }
        break;
        
      case 'ADD_NODE':
        if (message.senderId !== clientId) {
          addNode(message.nodeType, message.position);
        }
        break;
        
      case 'DELETE_NODE':
        if (message.senderId !== clientId) {
          deleteNode(message.nodeId);
        }
        break;
        
      case 'MOVE_NODE':
        if (message.senderId !== clientId) {
          moveNode(message.nodeId, message.position);
        }
        break;
        
      case 'ADD_CONNECTION':
        if (message.senderId !== clientId) {
          addConnection(
            message.fromNodeId,
            message.fromPortId,
            message.toNodeId,
            message.toPortId
          );
        }
        break;
        
      case 'DELETE_CONNECTION':
        if (message.senderId !== clientId) {
          deleteConnection(message.connectionId);
        }
        break;
    }
  };

  // Send a message over WebSocket
  const sendMessage = (message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  // Utility to send node updates to other clients
  const sendNodeUpdate = (nodeId: string, updates: any) => {
    if (isConnected) {
      sendMessage({
        type: 'UPDATE_NODE',
        nodeId,
        updates
      });
    }
  };
  
  // Utility to notify when a node is added
  const sendNodeAdded = (nodeType: string, position: { x: number, y: number }) => {
    if (isConnected) {
      sendMessage({
        type: 'ADD_NODE',
        nodeType,
        position
      });
    }
  };
  
  // Utility to notify when a node is deleted
  const sendNodeDeleted = (nodeId: string) => {
    if (isConnected) {
      sendMessage({
        type: 'DELETE_NODE',
        nodeId
      });
    }
  };
  
  // Utility to notify when a node is moved
  const sendNodeMoved = (nodeId: string, position: { x: number, y: number }) => {
    if (isConnected) {
      sendMessage({
        type: 'MOVE_NODE',
        nodeId,
        position
      });
    }
  };
  
  // Utility to notify when a connection is added
  const sendConnectionAdded = (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => {
    if (isConnected) {
      sendMessage({
        type: 'ADD_CONNECTION',
        fromNodeId,
        fromPortId,
        toNodeId,
        toPortId
      });
    }
  };
  
  // Utility to notify when a connection is deleted
  const sendConnectionDeleted = (connectionId: string) => {
    if (isConnected) {
      sendMessage({
        type: 'DELETE_CONNECTION',
        connectionId
      });
    }
  };

  return {
    isConnected,
    clientId,
    activeUsers,
    sendMessage,
    sendNodeUpdate,
    sendNodeAdded,
    sendNodeDeleted,
    sendNodeMoved,
    sendConnectionAdded,
    sendConnectionDeleted
  };
}
