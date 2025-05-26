// filepath: /workspaces/agentworkflow/src/lib/api.ts
import { useWorkflowStore } from "../hooks/useWorkflowStore";
import { Node, Connection } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      // Include credentials for session cookies
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "An unknown error occurred" };
    }

    return { data: data as T };
  } catch (error) {
    console.error("API request failed:", error);
    return { error: "Network error. Please try again later." };
  }
}

// Authentication API
export const authApi = {
  login: async (username: string, password: string) => {
    const result = await apiRequest<{ user: any; message: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      },
    );

    if (result.data?.user) {
      useWorkflowStore.getState().setUser(result.data.user);
    }

    return result;
  },

  register: async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => {
    const result = await apiRequest<{ user: any; message: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ username, email, password, confirmPassword }),
      },
    );

    if (result.data?.user) {
      useWorkflowStore.getState().setUser(result.data.user);
    }

    return result;
  },

  logout: async () => {
    const result = await apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
    });

    if (!result.error) {
      useWorkflowStore.getState().setUser(null);
    }

    return result;
  },

  getCurrentUser: async () => {
    const result = await apiRequest<{ user: any }>("/auth/me");

    if (result.data?.user) {
      useWorkflowStore.getState().setUser(result.data.user);
    }

    return result;
  },
};

// Workflows API
export interface WorkflowData {
  id?: string;
  name: string;
  description?: string;
  content: {
    nodes: Node[];
    connections: Connection[];
  };
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: number;
}

export const workflowApi = {
  getAll: async () => {
    return await apiRequest<{ workflows: WorkflowData[] }>("/workflows");
  },

  getPublic: async () => {
    return await apiRequest<{ workflows: WorkflowData[] }>("/workflows/public");
  },

  getById: async (id: string) => {
    return await apiRequest<{ workflow: WorkflowData }>(`/workflows/${id}`);
  },

  saveWorkflow: async (workflow: {
    name: string;
    description?: string;
    content: {
      nodes: Node[];
      connections: Connection[];
    };
    isPublic?: boolean;
  }) => {
    return await apiRequest<{ workflow: WorkflowData }>("/workflows", {
      method: "POST",
      body: JSON.stringify(workflow),
    });
  },

  update: async (
    id: string,
    workflow: {
      name?: string;
      description?: string;
      content?: {
        nodes: Node[];
        connections: Connection[];
      };
      isPublic?: boolean;
    },
  ) => {
    return await apiRequest<{ workflow: WorkflowData }>(`/workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(workflow),
    });
  },

  delete: async (id: string) => {
    return await apiRequest<{ message: string }>(`/workflows/${id}`, {
      method: "DELETE",
    });
  },
};
