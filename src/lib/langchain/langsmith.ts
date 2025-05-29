import { Client } from "langsmith";

// Flag to check if we're in Node.js environment
const isNode = typeof window === 'undefined';

// Helper to get environment variables that works in both browser and Node.js
const getEnv = (key: string, defaultValue?: string): string | undefined => {
  // Browser environment (Vite)
  if (!isNode) {
    return (import.meta.env?.[`VITE_${key}`] as string) || defaultValue;
  }
  // Node.js environment
  return process.env?.[key] || defaultValue;
};

// Variable to store environment variables
let langsmithClient: Client | null = null;

// Initialize the LangSmith client for tracking
const apiKey = getEnv('LANGCHAIN_API_KEY');
const endpoint = getEnv('LANGCHAIN_ENDPOINT', 'https://api.smith.langchain.com') || 'https://api.smith.langchain.com';
const project = getEnv('LANGCHAIN_PROJECT', 'agentworkflow') || 'agentworkflow';

// Initialize LangSmith tracking immediately
initLangSmith();

export function getLangSmithClient(): Client {
  if (!langsmithClient && apiKey) {
    langsmithClient = new Client({
      apiKey,
      apiUrl: endpoint,
    });
  }
  
  if (!langsmithClient) {
    throw new Error("LangSmith client could not be initialized. Check your LANGCHAIN_API_KEY in .env file.");
  }

  return langsmithClient;
}

// Helper function to ensure LangSmith tracking is enabled
export function initLangSmith() {
  if (apiKey) {
    // Set environment variables for LangChain to auto-track with LangSmith
    // Only set process.env in Node environment
    if (isNode && process?.env) {
      process.env.LANGCHAIN_TRACING_V2 = "true";
      process.env.LANGCHAIN_PROJECT = project as string;
    }
    
    console.log(`LangSmith tracking initialized for project: ${project}`);
    return true;
  } else {
    console.warn("LangSmith tracking disabled: LANGCHAIN_API_KEY not found");
    return false;
  }
}

// Create a new LangSmith project
export async function createProject(name: string, description?: string) {
  const client = getLangSmithClient();
  try {
    const result = await client.createProject({
      projectName: name,
      description,
    });
    return result;
  } catch (error) {
    console.error("Failed to create LangSmith project:", error);
    throw error;
  }
}

// Get runs for a specific project
export async function getProjectRuns(projectName: string, limit = 100) {
  const client = getLangSmithClient();
  try {
    const runs = await client.listRuns({
      projectName: projectName,
      limit,
    });
    return runs;
  } catch (error) {
    console.error(`Failed to get runs for project ${projectName}:`, error);
    throw error;
  }
}

// Get a specific run by ID
export async function getRun(runId: string) {
  const client = getLangSmithClient();
  try {
    const run = await client.readRun(runId);
    return run;
  } catch (error) {
    console.error(`Failed to get run ${runId}:`, error);
    throw error;
  }
}