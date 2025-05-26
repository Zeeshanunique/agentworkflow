import { useState } from "react";
import { Neo4jWorkflow, WorkflowStructure, WorkflowExecutionResult, LangSmithRun } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
const API_ENDPOINT = `${API_BASE_URL}/neo4j-workflows`;

export function useNeo4jWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check Neo4j connection status
   */
  const checkNeo4jStatus = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINT}/neo4j-status`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to check Neo4j status");
      }
      
      return data.connected;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new workflow in Neo4j
   */
  const createWorkflow = async (
    name: string,
    description: string = "",
    isPublic: boolean = false
  ): Promise<Neo4jWorkflow | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, description, isPublic }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create workflow");
      }
      
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all workflows for the current user
   */
  const getWorkflows = async (): Promise<Neo4jWorkflow[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINT, {
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workflows");
      }
      
      return data;
    } catch (err) {
      setError((err as Error).message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a specific workflow by ID
   */
  const getWorkflow = async (workflowId: string): Promise<Neo4jWorkflow | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINT}/${workflowId}`, {
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workflow");
      }
      
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get workflow structure (nodes and connections)
   */
  const getWorkflowStructure = async (workflowId: string): Promise<WorkflowStructure | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINT}/${workflowId}/structure`, {
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workflow structure");
      }
      
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save workflow structure
   */
  const saveWorkflowStructure = async (
    workflowId: string,
    structure: WorkflowStructure
  ): Promise<Neo4jWorkflow | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINT}/${workflowId}/structure`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(structure),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save workflow structure");
      }
      
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a workflow
   */
  const deleteWorkflow = async (workflowId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINT}/${workflowId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete workflow");
      }
      
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute a workflow
   */
  const executeWorkflow = async (
    workflowId: string,
    input: string
  ): Promise<WorkflowExecutionResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINT}/${workflowId}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ input }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to execute workflow");
      }
      
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get LangSmith runs for a workflow
   */
  const getWorkflowRuns = async (workflowId: string): Promise<LangSmithRun[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINT}/${workflowId}/runs`, {
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workflow runs");
      }
      
      return data;
    } catch (err) {
      setError((err as Error).message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a specific LangSmith run
   */
  const getWorkflowRun = async (workflowId: string, runId: string): Promise<LangSmithRun | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINT}/${workflowId}/runs/${runId}`, {
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workflow run");
      }
      
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    checkNeo4jStatus,
    createWorkflow,
    getWorkflows,
    getWorkflow,
    getWorkflowStructure,
    saveWorkflowStructure,
    deleteWorkflow,
    executeWorkflow,
    getWorkflowRuns,
    getWorkflowRun,
  };
} 