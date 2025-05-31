import { BaseNode, INodeExecutionContext, INodeExecutionData, INodeParameters } from './BaseNode';
import { Port } from '../../types';
import axios, { AxiosRequestConfig } from 'axios';

/**
 * HTTP Request Node
 * Makes HTTP requests to external APIs
 */
export class HttpRequestNode extends BaseNode {
  getName(): string {
    return 'HTTP Request';
  }

  getType(): string {
    return 'http_request';
  }

  getIcon(): string {
    return 'globe';
  }

  getCategory(): string {
    return 'core';
  }

  getDescription(): string {
    return 'Make HTTP requests to external APIs and services';
  }

  getInputs(): Port[] {
    return [
      {
        id: 'input',
        name: 'Input',
        type: 'any'
      }
    ];
  }

  getOutputs(): Port[] {
    return [
      {
        id: 'output',
        name: 'Output',
        type: 'object'
      }
    ];
  }

  getProperties(): {
    [key: string]: {
      displayName: string;
      type: string;
      default?: any;
      description?: string;
      required?: boolean;
      options?: Array<{ name: string; value: any }>;
      placeholder?: string;
    };
  } {
    return {
      url: {
        displayName: 'URL',
        type: 'string',
        description: 'The URL to make the request to',
        required: true,
        placeholder: 'https://example.com/api'
      },
      method: {
        displayName: 'Method',
        type: 'options',
        default: 'GET',
        description: 'The HTTP method to use',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'PATCH', value: 'PATCH' },
          { name: 'HEAD', value: 'HEAD' },
          { name: 'OPTIONS', value: 'OPTIONS' }
        ]
      },
      headers: {
        displayName: 'Headers',
        type: 'json',
        default: {},
        description: 'The headers to send with the request'
      },
      authentication: {
        displayName: 'Authentication',
        type: 'options',
        default: 'none',
        description: 'The authentication method to use',
        options: [
          { name: 'None', value: 'none' },
          { name: 'Basic Auth', value: 'basicAuth' },
          { name: 'Bearer Token', value: 'bearerToken' },
          { name: 'API Key', value: 'apiKey' },
          { name: 'OAuth2', value: 'oauth2' }
        ]
      },
      sendQuery: {
        displayName: 'Send Query Parameters',
        type: 'boolean',
        default: false,
        description: 'Whether to send the input data as query parameters'
      },
      sendBody: {
        displayName: 'Send Body',
        type: 'boolean',
        default: true,
        description: 'Whether to send the input data as the request body'
      },
      responseFormat: {
        displayName: 'Response Format',
        type: 'options',
        default: 'json',
        description: 'The format of the response',
        options: [
          { name: 'JSON', value: 'json' },
          { name: 'Text', value: 'text' },
          { name: 'Buffer', value: 'buffer' }
        ]
      },
      timeout: {
        displayName: 'Timeout',
        type: 'number',
        default: 10000,
        description: 'The timeout in milliseconds'
      }
    };
  }

  /**
   * Execute the HTTP request
   */
  async execute(context: INodeExecutionContext): Promise<INodeExecutionData[]> {
    const { inputData, node } = context;
    const parameters = node.parameters as INodeParameters;

    // Input data can be null if this is a trigger node with no inputs
    const input = inputData && inputData.length > 0 ? inputData[0].json : {};

    try {
      // Build request config
      const config: AxiosRequestConfig = {
        url: parameters.url,
        method: parameters.method || 'GET',
        timeout: parameters.timeout || 10000
      };

      // Add headers
      if (parameters.headers) {
        config.headers = typeof parameters.headers === 'string'
          ? JSON.parse(parameters.headers)
          : parameters.headers;
      }

      // Handle authentication
      if (parameters.authentication === 'basicAuth' && parameters.username && parameters.password) {
        config.auth = {
          username: parameters.username,
          password: parameters.password
        };
      } else if (parameters.authentication === 'bearerToken' && parameters.bearerToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${parameters.bearerToken}`
        };
      } else if (parameters.authentication === 'apiKey' && parameters.apiKey) {
        const headerName = parameters.apiKeyHeaderName || 'X-API-Key';
        config.headers = {
          ...config.headers,
          [headerName]: parameters.apiKey
        };
      }

      // Handle query parameters
      if (parameters.sendQuery && input) {
        config.params = input;
      }

      // Handle request body
      if (['POST', 'PUT', 'PATCH'].includes(config.method || '') && parameters.sendBody && input) {
        config.data = input;
      }

      // Make the request
      const response = await axios(config);

      // Format the response
      let responseData: any;
      
      if (parameters.responseFormat === 'json') {
        responseData = response.data;
      } else if (parameters.responseFormat === 'text') {
        responseData = typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data);
      } else if (parameters.responseFormat === 'buffer') {
        responseData = response.data;
      } else {
        responseData = response.data;
      }

      // Return the formatted response
      return [
        {
          json: {
            statusCode: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: responseData
          }
        }
      ];
    } catch (error) {
      // Handle error response
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return [
          {
            json: {
              statusCode: error.response.status,
              statusText: error.response.statusText,
              headers: error.response.headers,
              data: error.response.data,
              error: true
            }
          }
        ];
      } else if (error.request) {
        // The request was made but no response was received
        return [
          {
            json: {
              error: true,
              message: 'No response received from server',
              request: error.request
            }
          }
        ];
      } else {
        // Something happened in setting up the request that triggered an Error
        return [
          {
            json: {
              error: true,
              message: error.message
            }
          }
        ];
      }
    }
  }
}
