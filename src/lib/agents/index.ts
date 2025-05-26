import { executeMarketingTask } from './marketingAgent';
import { executeSalesTask } from './salesAgent';

// Agent types enum
export enum AgentType {
  MARKETING = 'marketing',
  SALES = 'sales',
}

// Factory function to get the right agent executor based on type
export async function executeAgentTask(type: AgentType, apiKey: string, task: string) {
  switch (type) {
    case AgentType.MARKETING:
      return executeMarketingTask(apiKey, task);
    case AgentType.SALES:
      return executeSalesTask(apiKey, task);
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

export { executeMarketingTask, executeSalesTask }; 