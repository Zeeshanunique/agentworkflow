import { ChatOpenAI } from "@langchain/openai";
import { Tool } from "@langchain/core/tools";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { HumanMessage } from "@langchain/core/messages";
import { initLangSmith } from "../langchain/langsmith";

// Initialize LangSmith for tracing
initLangSmith();

// Define base tools for sales agent
class LeadQualificationTool extends Tool {
  name = "lead_qualification";
  description = "Qualify leads based on provided information (BANT: Budget, Authority, Need, Timeline)";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.2, // Lower temperature for more predictable results
    });

    // Expecting JSON string with lead information
    let leadInfo;
    try {
      leadInfo = JSON.parse(input);
    } catch (e) {
      // If not valid JSON, use as is
      leadInfo = { rawData: input };
    }

    const prompt = `Analyze this lead information and qualify it based on BANT criteria (Budget, Authority, Need, Timeline).
    
    Lead Information:
    ${JSON.stringify(leadInfo, null, 2)}
    
    Provide a score from 1-10 for each BANT category and an overall qualification score.
    Explain your reasoning for each score.
    Recommend next steps for this lead.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }
}

class SalesEmailTool extends Tool {
  name = "sales_email_generator";
  description = "Generate personalized sales emails for prospects based on their profile and stage in the sales funnel";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.7,
    });

    // Parse input format: "stage|prospect|product|pain_points"
    // Example: "initial_outreach|CTO of tech company|CRM Software|data management,team collaboration"
    const [stage, prospect, product, painPoints] = input.split("|").map(s => s.trim());

    const prompt = `Create a personalized sales email for a ${prospect} at the ${stage} stage of the sales funnel.
    The product is ${product}.
    Key pain points to address: ${painPoints}.
    
    Include subject line, greeting, personalized opening, value proposition, clear CTA, and signature.
    Keep it concise, personable, and focused on solving their problems.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }
}

class SalesObjHandlerTool extends Tool {
  name = "objection_handler";
  description = "Generate responses to common sales objections";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.5,
    });

    // Parse input format: "objection|product|prospect_type"
    // Example: "too_expensive|Marketing Automation Software|SMB Marketing Manager"
    const [objection, product, prospectType] = input.split("|").map(s => s.trim());

    const prompt = `Create a response to handle this sales objection: "${objection}" from a ${prospectType} regarding ${product}.
    
    The response should:
    1. Acknowledge their concern
    2. Reframe the objection
    3. Provide value-based reasoning
    4. Ask a follow-up question to continue the conversation
    
    Keep it conversational, empathetic, and focused on value, not features.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }
}

class FollowUpGeneratorTool extends Tool {
  name = "follow_up_generator";
  description = "Generate follow-up messages for different stages of the sales process";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.7,
    });

    // Parse input format: "stage|last_interaction|days_since|prospect_info"
    // Example: "post_demo|showed interest but concerned about price|5|Marketing Director at midsize agency"
    const [stage, lastInteraction, daysSince, prospectInfo] = input.split("|").map(s => s.trim());

    const prompt = `Create a follow-up message for a ${prospectInfo} at the ${stage} stage of the sales process.
    
    Last interaction: ${lastInteraction}
    Days since last contact: ${daysSince}
    
    The message should be personalized, provide additional value, reference the previous interaction, and include a clear next step.
    Keep it concise and respectful of their time.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }
}

// Create a sales agent executor
export async function createSalesAgent(apiKey: string) {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.5,
    openAIApiKey: apiKey,
  });
  
  const tools = [
    new LeadQualificationTool(),
    new SalesEmailTool(),
    new SalesObjHandlerTool(),
    new FollowUpGeneratorTool(),
  ];
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert sales agent that helps with lead qualification, sales communication, and handling objections.
    Use the provided tools to accomplish sales tasks.
    Always focus on understanding the prospect's needs and communicating value, not just features.
    Adapt your communication style to the prospect's persona and stage in the buyer's journey.
    Be consultative rather than pushy, and focus on building a relationship.`],
    ["human", "{input}"],
  ]);
  
  const agent = await createOpenAIFunctionsAgent({
    llm: model,
    tools,
    prompt,
  });
  
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });
  
  return agentExecutor;
}

// Execute sales agent task
export async function executeSalesTask(apiKey: string, task: string) {
  try {
    const agentExecutor = await createSalesAgent(apiKey);
    const result = await agentExecutor.invoke({
      input: task,
    });
    
    return {
      success: true,
      output: result.output,
      logs: result.log,
    };
  } catch (error) {
    console.error("Error executing sales agent task:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
} 