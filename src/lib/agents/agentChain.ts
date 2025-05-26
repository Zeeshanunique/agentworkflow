import { executeAgentTask, AgentType } from "./index";

export interface AgentChainConfig {
  type: string;
  instructions?: string;
  parameters?: Record<string, any>;
}

export interface AgentChainResult {
  success: boolean;
  outputs: string[];
  finalOutput: string;
  error?: string;
}

/**
 * Execute a chain of agents where the output of one feeds into the next
 * @param apiKey OpenAI API key
 * @param initialInput Initial input to the first agent
 * @param agentConfigs Array of agent configurations
 * @param maxSteps Maximum number of steps to execute
 */
export async function executeAgentChain(
  apiKey: string,
  initialInput: string,
  agentConfigs: AgentChainConfig[],
  maxSteps: number = 5
): Promise<AgentChainResult> {
  if (!agentConfigs.length) {
    return {
      success: false,
      outputs: [],
      finalOutput: "",
      error: "Agent chain must contain at least one agent",
    };
  }

  let currentInput = initialInput;
  const outputs: string[] = [];
  
  try {
    // Execute each agent in sequence
    for (let i = 0; i < Math.min(agentConfigs.length, maxSteps); i++) {
      const agentConfig = agentConfigs[i];
      
      if (!agentConfig.type) {
        return {
          success: false,
          outputs,
          finalOutput: outputs.length ? outputs[outputs.length - 1] : "",
          error: `Agent at position ${i} has no type`,
        };
      }
      
      // Determine agent type
      const agentType = agentConfig.type.toLowerCase() === "marketing" 
        ? AgentType.MARKETING 
        : AgentType.SALES;
      
      // Append custom instructions if provided
      const agentTask = `${currentInput}${agentConfig.instructions ? "\n\nInstructions: " + agentConfig.instructions : ""}`;
      
      // Execute this agent in the chain
      const agentResult = await executeAgentTask(
        agentType,
        apiKey,
        agentTask
      );
      
      if (!agentResult.success) {
        return {
          success: false,
          outputs,
          finalOutput: outputs.length ? outputs[outputs.length - 1] : "",
          error: `Error in agent chain at step ${i+1}: ${agentResult.error}`,
        };
      }
      
      // Store this output
      outputs.push(agentResult.output);
      
      // Use this output as input to the next agent
      currentInput = agentResult.output;
    }
    
    return {
      success: true,
      outputs,
      finalOutput: outputs.length ? outputs[outputs.length - 1] : "",
    };
  } catch (error) {
    return {
      success: false,
      outputs,
      finalOutput: outputs.length ? outputs[outputs.length - 1] : "",
      error: (error as Error).message,
    };
  }
} 