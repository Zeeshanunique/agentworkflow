import { BaseNode, INodeTypeDescription, INodeExecutionData, INodeExecutionContext, createNodeProperties, StandardInputs, StandardOutputs, NodeGroups } from '../BaseNode';

/**
 * OpenAI Agent Node - AI-powered content generation
 */
export class OpenAIAgentNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'OpenAI Agent',
      name: 'openaiAgent',
      icon: 'fa:robot',
      group: NodeGroups.AGENT,
      version: 1,
      description: 'Generate content using OpenAI API',
      defaults: {
        name: 'OpenAI Agent',
        color: '#00a82d'
      },
      inputs: StandardInputs.main,
      outputs: StandardOutputs.main,
      credentials: [
        {
          name: 'openAiApi',
          required: true
        }
      ],
      properties: createNodeProperties([
        {
          displayName: 'Model',
          name: 'model',
          type: 'options',
          default: 'gpt-3.5-turbo',
          options: [
            { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
            { name: 'GPT-4', value: 'gpt-4' },
            { name: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' }
          ],
          description: 'OpenAI model to use'
        },
        {
          displayName: 'System Message',
          name: 'systemMessage',
          type: 'string',
          default: 'You are a helpful AI assistant.',
          description: 'System message to set the context for the AI'
        },
        {
          displayName: 'User Message',
          name: 'userMessage',
          type: 'string',
          required: true,
          default: '',
          placeholder: 'Write a blog post about...',
          description: 'The message to send to the AI'
        },
        {
          displayName: 'Temperature',
          name: 'temperature',
          type: 'number',
          default: 0.7,
          description: 'Controls randomness in the output (0-2)'
        },
        {
          displayName: 'Max Tokens',
          name: 'maxTokens',
          type: 'number',
          default: 1000,
          description: 'Maximum number of tokens to generate'
        }
      ])
    };

    super(description);
  }

  async execute(
    this: INodeExecutionContext,
    inputData: INodeExecutionData[][]
  ): Promise<INodeExecutionData[][]> {
    const returnData: INodeExecutionData[] = [];
    
    for (let i = 0; i < inputData[0].length; i++) {
      const model = this.getNodeParameter('model', i) as string;
      const systemMessage = this.getNodeParameter('systemMessage', i) as string;
      const userMessage = this.getNodeParameter('userMessage', i) as string;
      const temperature = this.getNodeParameter('temperature', i) as number;
      const maxTokens = this.getNodeParameter('maxTokens', i) as number;
      
      try {
        const credentials = await this.getCredentials('openAiApi');
        
        const response = await this.helpers.httpRequest({
          method: 'POST',
          url: 'https://api.openai.com/v1/chat/completions',
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userMessage }
            ],
            temperature,
            max_tokens: maxTokens
          })
        });

        returnData.push({
          json: {
            response: response.choices[0].message.content,
            model,
            usage: response.usage,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error: any) {
        returnData.push({
          json: {
            error: true,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    return [returnData];
  }
}

/**
 * Marketing Agent Node - Specialized AI agent for marketing tasks
 */
export class MarketingAgentNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Marketing Agent',
      name: 'marketingAgent',
      icon: 'fa:bullhorn',
      group: NodeGroups.AGENT,
      version: 1,
      description: 'AI agent specialized for marketing tasks',
      defaults: {
        name: 'Marketing Agent',
        color: '#ff6b6b'
      },
      inputs: StandardInputs.main,
      outputs: StandardOutputs.main,
      credentials: [
        {
          name: 'openAiApi',
          required: true
        }
      ],
      properties: createNodeProperties([
        {
          displayName: 'Marketing Task',
          name: 'marketingTask',
          type: 'options',
          default: 'content_creation',
          options: [
            { name: 'Content Creation', value: 'content_creation' },
            { name: 'SEO Optimization', value: 'seo_optimization' },
            { name: 'Social Media Posts', value: 'social_media' },
            { name: 'Email Campaign', value: 'email_campaign' },
            { name: 'Product Description', value: 'product_description' },
            { name: 'Ad Copy', value: 'ad_copy' }
          ],
          description: 'Type of marketing task to perform'
        },
        {
          displayName: 'Topic/Product',
          name: 'topic',
          type: 'string',
          required: true,
          default: '',
          placeholder: 'Eco-friendly water bottles',
          description: 'The topic, product, or service to create marketing content for'
        },
        {
          displayName: 'Target Audience',
          name: 'targetAudience',
          type: 'string',
          default: '',
          placeholder: 'Health-conscious millennials',
          description: 'The target audience for the marketing content'
        },
        {
          displayName: 'Brand Voice',
          name: 'brandVoice',
          type: 'options',
          default: 'professional',
          options: [
            { name: 'Professional', value: 'professional' },
            { name: 'Casual', value: 'casual' },
            { name: 'Friendly', value: 'friendly' },
            { name: 'Authoritative', value: 'authoritative' },
            { name: 'Playful', value: 'playful' }
          ],
          description: 'The brand voice to use in the content'
        },
        {
          displayName: 'Additional Instructions',
          name: 'additionalInstructions',
          type: 'string',
          default: '',
          placeholder: 'Focus on sustainability benefits...',
          description: 'Any additional instructions for the marketing agent'
        }
      ])
    };

    super(description);
  }

  async execute(
    this: INodeExecutionContext,
    inputData: INodeExecutionData[][]
  ): Promise<INodeExecutionData[][]> {
    const returnData: INodeExecutionData[] = [];
    
    for (let i = 0; i < inputData[0].length; i++) {
      const marketingTask = this.getNodeParameter('marketingTask', i) as string;
      const topic = this.getNodeParameter('topic', i) as string;
      const targetAudience = this.getNodeParameter('targetAudience', i) as string;
      const brandVoice = this.getNodeParameter('brandVoice', i) as string;
      const additionalInstructions = this.getNodeParameter('additionalInstructions', i) as string;
      
      try {
        const credentials = await this.getCredentials('openAiApi');
          const systemPrompt = MarketingAgentNode.buildMarketingSystemPrompt(marketingTask, targetAudience, brandVoice);
        const userPrompt = MarketingAgentNode.buildMarketingUserPrompt(marketingTask, topic, additionalInstructions);
        
        const response = await this.helpers.httpRequest({
          method: 'POST',
          url: 'https://api.openai.com/v1/chat/completions',
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        returnData.push({
          json: {
            content: response.choices[0].message.content,
            task: marketingTask,
            topic,
            targetAudience,
            brandVoice,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error: any) {
        returnData.push({
          json: {
            error: true,
            message: error.message,
            task: marketingTask,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    return [returnData];
  }

  private static buildMarketingSystemPrompt(task: string, audience: string, voice: string): string {
    const taskDescriptions = {
      content_creation: 'You are a content marketing specialist who creates engaging blog posts, articles, and web content.',
      seo_optimization: 'You are an SEO expert who optimizes content for search engines while maintaining readability.',
      social_media: 'You are a social media marketing expert who creates engaging posts for various platforms.',
      email_campaign: 'You are an email marketing specialist who creates compelling email campaigns.',
      product_description: 'You are a copywriter who creates compelling product descriptions that drive sales.',
      ad_copy: 'You are an advertising copywriter who creates persuasive ad copy that converts.'
    };

    const voiceDescriptions = {
      professional: 'Use a professional, business-oriented tone.',
      casual: 'Use a casual, conversational tone.',
      friendly: 'Use a warm, friendly, and approachable tone.',
      authoritative: 'Use an authoritative, expert tone.',
      playful: 'Use a playful, fun, and energetic tone.'
    };

    return `${taskDescriptions[task as keyof typeof taskDescriptions] || taskDescriptions.content_creation}
    
${voiceDescriptions[voice as keyof typeof voiceDescriptions] || voiceDescriptions.professional}

${audience ? `Your target audience is: ${audience}` : ''}

Focus on creating high-quality, engaging content that resonates with the target audience and achieves the marketing objectives.`;
  }

  private static buildMarketingUserPrompt(task: string, topic: string, instructions: string): string {
    const taskPrompts = {
      content_creation: `Create engaging content about: ${topic}`,
      seo_optimization: `Create SEO-optimized content about: ${topic}`,
      social_media: `Create social media posts about: ${topic}`,
      email_campaign: `Create an email campaign about: ${topic}`,
      product_description: `Create a product description for: ${topic}`,
      ad_copy: `Create ad copy for: ${topic}`
    };

    let prompt = taskPrompts[task as keyof typeof taskPrompts] || `Create marketing content about: ${topic}`;
    
    if (instructions) {
      prompt += `\n\nAdditional instructions: ${instructions}`;
    }

    return prompt;
  }
}

/**
 * Sales Agent Node - Specialized AI agent for sales tasks
 */
export class SalesAgentNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Sales Agent',
      name: 'salesAgent',
      icon: 'fa:handshake',
      group: NodeGroups.AGENT,
      version: 1,
      description: 'AI agent specialized for sales tasks',
      defaults: {
        name: 'Sales Agent',
        color: '#4ecdc4'
      },
      inputs: StandardInputs.main,
      outputs: StandardOutputs.main,
      credentials: [
        {
          name: 'openAiApi',
          required: true
        }
      ],
      properties: createNodeProperties([
        {
          displayName: 'Sales Task',
          name: 'salesTask',
          type: 'options',
          default: 'lead_qualification',
          options: [
            { name: 'Lead Qualification', value: 'lead_qualification' },
            { name: 'Proposal Writing', value: 'proposal_writing' },
            { name: 'Follow-up Email', value: 'follow_up_email' },
            { name: 'Objection Handling', value: 'objection_handling' },
            { name: 'Sales Script', value: 'sales_script' },
            { name: 'Deal Analysis', value: 'deal_analysis' }
          ],
          description: 'Type of sales task to perform'
        },
        {
          displayName: 'Product/Service',
          name: 'product',
          type: 'string',
          required: true,
          default: '',
          placeholder: 'CRM Software',
          description: 'The product or service being sold'
        },
        {
          displayName: 'Customer Information',
          name: 'customerInfo',
          type: 'string',
          default: '',
          placeholder: 'Mid-size tech company, 100 employees...',
          description: 'Information about the customer or prospect'
        },
        {
          displayName: 'Sales Stage',
          name: 'salesStage',
          type: 'options',
          default: 'discovery',
          options: [
            { name: 'Prospecting', value: 'prospecting' },
            { name: 'Discovery', value: 'discovery' },
            { name: 'Proposal', value: 'proposal' },
            { name: 'Negotiation', value: 'negotiation' },
            { name: 'Closing', value: 'closing' },
            { name: 'Follow-up', value: 'follow_up' }
          ],
          description: 'Current stage in the sales process'
        },
        {
          displayName: 'Context/Notes',
          name: 'context',
          type: 'string',
          default: '',
          placeholder: 'Previous meeting notes, specific requirements...',
          description: 'Additional context or notes about the sales situation'
        }
      ])
    };

    super(description);
  }

  async execute(
    this: INodeExecutionContext,
    inputData: INodeExecutionData[][]
  ): Promise<INodeExecutionData[][]> {
    const returnData: INodeExecutionData[] = [];
    
    for (let i = 0; i < inputData[0].length; i++) {
      const salesTask = this.getNodeParameter('salesTask', i) as string;
      const product = this.getNodeParameter('product', i) as string;
      const customerInfo = this.getNodeParameter('customerInfo', i) as string;
      const salesStage = this.getNodeParameter('salesStage', i) as string;
      const context = this.getNodeParameter('context', i) as string;
      
      try {
        const credentials = await this.getCredentials('openAiApi');
          const systemPrompt = SalesAgentNode.buildSalesSystemPrompt(salesTask, salesStage);
        const userPrompt = SalesAgentNode.buildSalesUserPrompt(salesTask, product, customerInfo, context);
        
        const response = await this.helpers.httpRequest({
          method: 'POST',
          url: 'https://api.openai.com/v1/chat/completions',
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        returnData.push({
          json: {
            content: response.choices[0].message.content,
            task: salesTask,
            product,
            customerInfo,
            salesStage,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error: any) {
        returnData.push({
          json: {
            error: true,
            message: error.message,
            task: salesTask,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    return [returnData];
  }

  private static buildSalesSystemPrompt(task: string, stage: string): string {
    const taskDescriptions = {
      lead_qualification: 'You are a sales development representative who qualifies leads based on budget, authority, need, and timeline.',
      proposal_writing: 'You are a sales professional who writes compelling proposals that address customer needs and demonstrate value.',
      follow_up_email: 'You are a sales representative who writes effective follow-up emails that move deals forward.',
      objection_handling: 'You are an experienced sales professional who handles objections with empathy and provides compelling responses.',
      sales_script: 'You are a sales trainer who creates effective sales scripts for different scenarios.',
      deal_analysis: 'You are a sales analyst who evaluates deals and provides insights on probability and next steps.'
    };

    const stageGuidance = {
      prospecting: 'Focus on building rapport and identifying potential needs.',
      discovery: 'Ask probing questions to understand pain points and requirements.',
      proposal: 'Present solutions that directly address identified needs.',
      negotiation: 'Find win-win solutions and address concerns.',
      closing: 'Create urgency and guide toward a decision.',
      follow_up: 'Maintain relationship and identify additional opportunities.'
    };

    return `${taskDescriptions[task as keyof typeof taskDescriptions] || taskDescriptions.lead_qualification}

Current sales stage: ${stage}
Stage guidance: ${stageGuidance[stage as keyof typeof stageGuidance]}

Use consultative selling techniques and focus on understanding and solving customer problems rather than just pushing products.`;
  }

  private static buildSalesUserPrompt(task: string, product: string, customerInfo: string, context: string): string {
    let prompt = `Product/Service: ${product}`;
    
    if (customerInfo) {
      prompt += `\nCustomer Information: ${customerInfo}`;
    }
    
    if (context) {
      prompt += `\nAdditional Context: ${context}`;
    }

    const taskActions = {
      lead_qualification: 'Qualify this lead and determine if they are a good fit.',
      proposal_writing: 'Write a compelling proposal.',
      follow_up_email: 'Write a follow-up email.',
      objection_handling: 'Provide responses to common objections.',
      sales_script: 'Create a sales script for this scenario.',
      deal_analysis: 'Analyze this deal and provide insights.'
    };

    prompt += `\n\nTask: ${taskActions[task as keyof typeof taskActions] || 'Provide sales assistance for this scenario.'}`;

    return prompt;
  }
}

/**
 * Agent Chain Node - Chains multiple agents together
 */
export class AgentChainNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Agent Chain',
      name: 'agentChain',
      icon: 'fa:link',
      group: NodeGroups.AGENT,
      version: 1,
      description: 'Chain multiple AI agents together in sequence',
      defaults: {
        name: 'Agent Chain',
        color: '#9b59b6'
      },
      inputs: StandardInputs.main,
      outputs: StandardOutputs.main,
      credentials: [
        {
          name: 'openAiApi',
          required: true
        }
      ],
      properties: createNodeProperties([
        {
          displayName: 'Chain Configuration',
          name: 'chainConfig',
          type: 'json',
          default: '[]',
          description: 'JSON configuration for the agent chain',
          placeholder: '[{"type": "marketing", "task": "content_creation"}, {"type": "sales", "task": "proposal_writing"}]'
        },
        {
          displayName: 'Max Steps',
          name: 'maxSteps',
          type: 'number',
          default: 5,
          description: 'Maximum number of steps in the chain'
        },
        {
          displayName: 'Initial Input',
          name: 'initialInput',
          type: 'string',
          default: '',
          placeholder: 'Initial input for the agent chain...',
          description: 'The initial input to start the agent chain'
        }
      ])
    };

    super(description);
  }

  async execute(
    this: INodeExecutionContext,
    inputData: INodeExecutionData[][]
  ): Promise<INodeExecutionData[][]> {
    const returnData: INodeExecutionData[] = [];
    
    for (let i = 0; i < inputData[0].length; i++) {
      const chainConfigRaw = this.getNodeParameter('chainConfig', i) as string;
      const maxSteps = this.getNodeParameter('maxSteps', i) as number;
      const initialInput = this.getNodeParameter('initialInput', i) as string;
      
      try {
        const chainConfig = JSON.parse(chainConfigRaw);
        const credentials = await this.getCredentials('openAiApi');
        
        let currentInput = initialInput || inputData[0][i].json.input || '';
        const chainResults: any[] = [];
          for (let step = 0; step < Math.min(chainConfig.length, maxSteps); step++) {
          const agentConfig = chainConfig[step];
          
          const result = await AgentChainNode.executeAgentStep(
            agentConfig,
            currentInput,
            credentials.apiKey as string
          );
          
          chainResults.push({
            step: step + 1,
            agent: agentConfig,
            input: currentInput,
            output: result
          });
          
          // Use the output as input for the next step
          currentInput = result;
        }
        
        returnData.push({
          json: {
            chainResults,
            finalOutput: currentInput,
            steps: chainResults.length,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error: any) {
        returnData.push({
          json: {
            error: true,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    return [returnData];
  }
  private static async executeAgentStep(agentConfig: any, input: string, apiKey: string): Promise<string> {
    const systemPrompt = AgentChainNode.buildAgentSystemPrompt(agentConfig);
    
    // Mock implementation for static method - in reality would use fetch or axios
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const responseData = await response.json();
    return responseData.choices[0].message.content;
  }

  private static buildAgentSystemPrompt(agentConfig: any): string {
    const { type, task, instructions } = agentConfig;
    
    const agentPrompts = {
      marketing: 'You are a marketing specialist.',
      sales: 'You are a sales professional.',
      customer_service: 'You are a customer service representative.',
      content: 'You are a content creator.',
      analyst: 'You are a business analyst.'
    };
    
    let prompt = agentPrompts[type as keyof typeof agentPrompts] || 'You are a helpful AI assistant.';
    
    if (task) {
      prompt += ` Your task is: ${task}.`;
    }
    
    if (instructions) {
      prompt += ` Additional instructions: ${instructions}`;
    }
    
    return prompt;
  }
}
