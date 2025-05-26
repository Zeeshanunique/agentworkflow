import { Client } from "langsmith";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize the LangSmith client for tracking
const apiKey = process.env.LANGCHAIN_API_KEY;
const endpoint = process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com";
const project = process.env.LANGCHAIN_PROJECT || "agentworkflow";

let langsmithClient: Client | null = null;

export function getLangSmithClient(): Client {
  if (!langsmithClient && apiKey) {
    langsmithClient = new Client({
      apiKey,
      endpoint,
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
    process.env.LANGCHAIN_TRACING_V2 = "true";
    process.env.LANGCHAIN_PROJECT = project;
    
    console.log(`LangSmith tracking initialized for project: ${project}`);
    return true;
  } else {
    console.warn("LangSmith tracking disabled: LANGCHAIN_API_KEY not found in .env");
    return false;
  }
}

// Create a new LangSmith project
export async function createProject(name: string, description?: string) {
  const client = getLangSmithClient();
  try {
    const result = await client.createProject({
      name,
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
      project: projectName,
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
    const run = await client.getRun(runId);
    return run;
  } catch (error) {
    console.error(`Failed to get run ${runId}:`, error);
    throw error;
  }
}

// Initialize LangSmith when this module is imported
initLangSmith(); 