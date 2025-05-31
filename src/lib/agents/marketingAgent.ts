import { ChatOpenAI } from "langchain/chat_models/openai";
import { Tool } from "@langchain/core/tools";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage } from "langchain/schema";
import { initLangSmith } from "../langchain/langsmith";

// Initialize LangSmith for tracing
initLangSmith();

// Define base tools for marketing agent
class ContentGeneratorTool extends Tool {
  name = "content_generator";
  description = "Generate marketing content like blog posts, social media captions, email subjects, etc.";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.7,
    });

    // Parse input format: "type|topic|tone|length"
    // Example: "blog_post|AI in Marketing|professional|medium"
    const [type, topic, tone, length] = input.split("|").map(s => s.trim());

    const prompt = `Create a ${length || "medium"} length ${type} about "${topic}" in a ${tone || "professional"} tone.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }
}

class AdCopyGeneratorTool extends Tool {
  name = "ad_copy_generator";
  description = "Generate ad copy for different platforms (Facebook, Google, LinkedIn, etc.)";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.7,
    });

    // Parse input format: "platform|product|audience|goal"
    // Example: "facebook|AI Marketing Tool|marketing directors|lead generation"
    const [platform, product, audience, goal] = input.split("|").map(s => s.trim());

    const prompt = `Create compelling ad copy for ${platform} advertising for "${product}" targeting ${audience} with the goal of ${goal}.
    Include a headline, primary text, and call to action.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }
}

class EmailTemplateGeneratorTool extends Tool {
  name = "email_template_generator";
  description = "Generate email templates for campaigns, follow-ups, nurturing sequences, etc.";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.7,
    });

    // Parse input format: "type|product|audience|goal"
    // Example: "follow_up|CRM Software|sales leaders|demo booking"
    const [type, product, audience, goal] = input.split("|").map(s => s.trim());

    const prompt = `Create a ${type} email template for ${product} targeting ${audience} with the goal of ${goal}.
    Include subject line, greeting, body content, and signature.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    return response.content as string;
  }
}

// Create a marketing agent executor
export async function createMarketingAgent(apiKey: string) {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    openAIApiKey: apiKey,
  });
  
  const tools = [
    new ContentGeneratorTool(),
    new AdCopyGeneratorTool(),
    new EmailTemplateGeneratorTool(),
  ];
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert marketing agent that helps create marketing content, ad copy, and email templates. 
    Use the provided tools to accomplish marketing tasks.
    Always analyze the target audience and craft your content to resonate with them.
    Follow marketing best practices and focus on creating content that drives engagement and conversions.`],
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

// Execute marketing agent task
export async function executeMarketingTask(apiKey: string, task: string) {
  try {
    const agentExecutor = await createMarketingAgent(apiKey);
    const result = await agentExecutor.invoke({
      input: task,
    });
    
    return {
      success: true,
      output: result.output,
      logs: result.log,
    };
  } catch (error) {
    console.error("Error executing marketing agent task:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
} 