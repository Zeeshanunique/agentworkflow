import { BaseNode, INodeTypeDescription, INodeExecutionData, INodeExecutionContext, createNodeProperties, StandardInputs, StandardOutputs, NodeGroups } from '../BaseNode';

/**
 * HTTP Request Node - Core action node for making HTTP requests
 */
export class HttpRequestNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'HTTP Request',
      name: 'httpRequest',
      icon: 'fa:globe',
      group: NodeGroups.REGULAR,
      version: 1,
      description: 'Makes HTTP requests to any URL',
      defaults: {
        name: 'HTTP Request',
        color: '#0066cc'
      },
      inputs: StandardInputs.main,
      outputs: StandardOutputs.main,
      properties: createNodeProperties([
        {
          displayName: 'Authentication',
          name: 'authentication',
          type: 'options',
          default: 'none',
          options: [
            { name: 'None', value: 'none' },
            { name: 'Basic Auth', value: 'basicAuth' },
            { name: 'Header Auth', value: 'headerAuth' },
            { name: 'OAuth2', value: 'oauth2' }
          ],
          description: 'Authentication method to use'
        },
        {
          displayName: 'Request Method',
          name: 'requestMethod',
          type: 'options',
          default: 'GET',
          options: [
            { name: 'GET', value: 'GET' },
            { name: 'POST', value: 'POST' },
            { name: 'PUT', value: 'PUT' },
            { name: 'DELETE', value: 'DELETE' },
            { name: 'PATCH', value: 'PATCH' },
            { name: 'HEAD', value: 'HEAD' }
          ],
          description: 'The request method to use'
        },
        {
          displayName: 'URL',
          name: 'url',
          type: 'string',
          required: true,
          default: '',
          placeholder: 'https://api.example.com/endpoint',
          description: 'The URL to make the request to'
        },
        {
          displayName: 'Send Headers',
          name: 'sendHeaders',
          type: 'boolean',
          default: false,
          description: 'Whether to send custom headers'
        },
        {
          displayName: 'Headers',
          name: 'headers',
          type: 'collection',
          default: {},
          description: 'Custom headers to send',
          displayOptions: {
            show: {
              sendHeaders: [true]
            }
          }
        },
        {
          displayName: 'Send Body',
          name: 'sendBody',
          type: 'boolean',
          default: false,
          description: 'Whether to send a request body',
          displayOptions: {
            show: {
              requestMethod: ['POST', 'PUT', 'PATCH']
            }
          }
        },
        {
          displayName: 'Body Content Type',
          name: 'bodyContentType',
          type: 'options',
          default: 'json',
          options: [
            { name: 'JSON', value: 'json' },
            { name: 'Form Data', value: 'form' },
            { name: 'Raw', value: 'raw' }
          ],
          description: 'Content type of the body',
          displayOptions: {
            show: {
              sendBody: [true]
            }
          }
        },
        {
          displayName: 'JSON Body',
          name: 'jsonBody',
          type: 'json',
          default: '{}',
          description: 'JSON body to send',
          displayOptions: {
            show: {
              sendBody: [true],
              bodyContentType: ['json']
            }
          }
        },
        {
          displayName: 'Timeout',
          name: 'timeout',
          type: 'number',
          default: 30000,
          description: 'Request timeout in milliseconds'
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
      const url = this.getNodeParameter('url', i) as string;
      const method = this.getNodeParameter('requestMethod', i) as string;
      const timeout = this.getNodeParameter('timeout', i) as number;
      const sendHeaders = this.getNodeParameter('sendHeaders', i) as boolean;
      const sendBody = this.getNodeParameter('sendBody', i) as boolean;
      
      let headers: any = {
        'User-Agent': 'n8n-workflow-agent/1.0'
      };
      
      if (sendHeaders) {
        const customHeaders = this.getNodeParameter('headers', i, {}) as any;
        headers = { ...headers, ...customHeaders };
      }
      
      let body: any;
      if (sendBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
        const bodyContentType = this.getNodeParameter('bodyContentType', i) as string;
        
        if (bodyContentType === 'json') {
          body = this.getNodeParameter('jsonBody', i, {});
          headers['Content-Type'] = 'application/json';
        }
      }

      try {
        const response = await this.helpers.httpRequest({
          method,
          url,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          timeout,
          returnFullResponse: true
        });

        returnData.push({
          json: {
            statusCode: response.statusCode,
            headers: response.headers,
            body: response.body
          }
        });
      } catch (error: any) {
        returnData.push({
          json: {
            error: true,
            message: error.message,
            statusCode: error.statusCode || 500
          }
        });
      }
    }

    return [returnData];
  }
}

/**
 * Set Node - Core node for setting/manipulating data
 */
export class SetNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Set',
      name: 'set',
      icon: 'fa:cog',
      group: NodeGroups.TRANSFORM,
      version: 1,
      description: 'Sets values on the data and optionally remove values',
      defaults: {
        name: 'Set',
        color: '#0066cc'
      },
      inputs: StandardInputs.main,
      outputs: StandardOutputs.main,
      properties: createNodeProperties([
        {
          displayName: 'Keep Only Set',
          name: 'keepOnlySet',
          type: 'boolean',
          default: false,
          description: 'If only the values set on this node should be kept and all others removed'
        },
        {
          displayName: 'Values to Set',
          name: 'values',
          type: 'collection',
          default: {},
          description: 'The values to set'
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
      const keepOnlySet = this.getNodeParameter('keepOnlySet', i) as boolean;
      const values = this.getNodeParameter('values', i, {}) as any;
      
      let newData: any;
      
      if (keepOnlySet) {
        newData = { ...values };
      } else {
        newData = { ...inputData[0][i].json, ...values };
      }

      returnData.push({
        json: newData
      });
    }

    return [returnData];
  }
}

/**
 * If Node - Conditional logic node
 */
export class IfNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'IF',
      name: 'if',
      icon: 'fa:code-branch',
      group: NodeGroups.REGULAR,
      version: 1,
      description: 'Routes data based on conditions',
      defaults: {
        name: 'IF',
        color: '#0066cc'
      },
      inputs: StandardInputs.main,
      outputs: [
        { displayName: 'True', type: 'main' },
        { displayName: 'False', type: 'main' }
      ],
      properties: createNodeProperties([
        {
          displayName: 'Conditions',
          name: 'conditions',
          type: 'collection',
          default: {},
          description: 'The conditions to check'
        },
        {
          displayName: 'Combine',
          name: 'combineOperation',
          type: 'options',
          default: 'all',
          options: [
            { name: 'ALL', value: 'all', description: 'All conditions must be true' },
            { name: 'ANY', value: 'any', description: 'At least one condition must be true' }
          ],
          description: 'How to combine multiple conditions'
        }
      ])
    };

    super(description);
  }

  async execute(
    this: INodeExecutionContext,
    inputData: INodeExecutionData[][]
  ): Promise<INodeExecutionData[][]> {
    const trueData: INodeExecutionData[] = [];
    const falseData: INodeExecutionData[] = [];
    
    for (let i = 0; i < inputData[0].length; i++) {
      const conditions = this.getNodeParameter('conditions', i, {}) as any;
      const combineOperation = this.getNodeParameter('combineOperation', i) as string;
      
      // Simplified condition evaluation
      const conditionResult = IfNode.evaluateConditions(inputData[0][i].json, conditions, combineOperation);
      
      if (conditionResult) {
        trueData.push(inputData[0][i]);
      } else {
        falseData.push(inputData[0][i]);
      }
    }

    return [trueData, falseData];
  }
  private static evaluateConditions(data: any, conditions: any, combineOperation: string): boolean {
    // Simplified condition evaluation - in real implementation would be more complex
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }
    
    // Mock evaluation for demonstration using provided parameters
    const hasData = data && Object.keys(data).length > 0;
    const isAndOperation = combineOperation === 'AND';
    
    // Return a simple boolean based on data existence for now
    return hasData || !isAndOperation;
  }
}

/**
 * Code Node - Execute custom JavaScript code
 */
export class CodeNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Code',
      name: 'code',
      icon: 'fa:code',
      group: NodeGroups.TRANSFORM,
      version: 1,
      description: 'Run custom JavaScript code',
      defaults: {
        name: 'Code',
        color: '#666666'
      },
      inputs: StandardInputs.main,
      outputs: StandardOutputs.main,
      properties: createNodeProperties([
        {
          displayName: 'Mode',
          name: 'mode',
          type: 'options',
          default: 'runOnceForAllItems',
          options: [
            { name: 'Run Once for All Items', value: 'runOnceForAllItems' },
            { name: 'Run Once for Each Item', value: 'runOnceForEachItem' }
          ],
          description: 'How to execute the code'
        },
        {
          displayName: 'JavaScript Code',
          name: 'jsCode',
          type: 'string',
          default: '// Your JavaScript code here\nreturn items;',
          description: 'The JavaScript code to execute',
          placeholder: '// Your code here\nreturn items;'
        }
      ])
    };

    super(description);
  }

  async execute(
    this: INodeExecutionContext,
    inputData: INodeExecutionData[][]
  ): Promise<INodeExecutionData[][]> {
    const mode = this.getNodeParameter('mode', 0) as string;
    const jsCode = this.getNodeParameter('jsCode', 0) as string;
    
    const items = inputData[0].map(item => item.json);
    
    try {
      let result: any;
      
      if (mode === 'runOnceForAllItems') {
        // Execute code once with all items
        const func = new Function('items', '$json', '$item', '$input', jsCode);
        result = func(items, items[0] || {}, (index: number) => items[index] || {}, {
          all: () => items,
          first: () => items[0] || {},
          last: () => items[items.length - 1] || {}
        });
      } else {
        // Execute code for each item
        result = [];
        for (let i = 0; i < items.length; i++) {
          const func = new Function('item', '$json', '$input', 'items', jsCode);
          const itemResult = func(items[i], items[i], {
            all: () => items,
            first: () => items[0] || {},
            last: () => items[items.length - 1] || {}
          }, items);
          result.push(itemResult);
        }
      }
      
      // Convert result to the expected format
      const returnData = Array.isArray(result) 
        ? result.map(item => ({ json: item }))
        : [{ json: result }];
      
      return [returnData];
    } catch (error: any) {
      throw new Error(`Code execution error: ${error.message}`);
    }
  }
}

/**
 * Merge Node - Merge data from multiple inputs
 */
export class MergeNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Merge',
      name: 'merge',
      icon: 'fa:code-branch',
      group: NodeGroups.TRANSFORM,
      version: 1,
      description: 'Merges data from multiple inputs',
      defaults: {
        name: 'Merge',
        color: '#0066cc'
      },
      inputs: [
        { displayName: 'Input 1', type: 'main', required: true },
        { displayName: 'Input 2', type: 'main', required: true }
      ],
      outputs: StandardOutputs.main,
      properties: createNodeProperties([
        {
          displayName: 'Mode',
          name: 'mode',
          type: 'options',
          default: 'append',
          options: [
            { name: 'Append', value: 'append', description: 'Appends data of input 2 to input 1' },
            { name: 'Pass-through', value: 'passThrough', description: 'Passes through data of one input' },
            { name: 'Wait', value: 'wait', description: 'Waits for data on both inputs before outputting' }
          ],
          description: 'How to merge the data'
        },
        {
          displayName: 'Output Data',
          name: 'outputData',
          type: 'options',
          default: 'input1',
          options: [
            { name: 'Input 1', value: 'input1' },
            { name: 'Input 2', value: 'input2' }
          ],
          description: 'Which input to output when using pass-through mode',
          displayOptions: {
            show: {
              mode: ['passThrough']
            }
          }
        }
      ])
    };

    super(description);
  }

  async execute(
    this: INodeExecutionContext,
    inputData: INodeExecutionData[][]
  ): Promise<INodeExecutionData[][]> {
    const mode = this.getNodeParameter('mode', 0) as string;
    
    const input1Data = inputData[0] || [];
    const input2Data = inputData[1] || [];
    
    let returnData: INodeExecutionData[];
    
    switch (mode) {
      case 'append':
        returnData = [...input1Data, ...input2Data];
        break;
      case 'passThrough':
        const outputData = this.getNodeParameter('outputData', 0) as string;
        returnData = outputData === 'input1' ? input1Data : input2Data;
        break;
      case 'wait':
        // Only output if both inputs have data
        if (input1Data.length > 0 && input2Data.length > 0) {
          returnData = [...input1Data, ...input2Data];
        } else {
          returnData = [];
        }
        break;
      default:
        returnData = input1Data;
    }

    return [returnData];
  }
}
