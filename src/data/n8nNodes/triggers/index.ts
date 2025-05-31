import { BaseNode, INodeTypeDescription, INodeExecutionData, INodeExecutionContext } from '../BaseNode';

/**
 * Manual Trigger Node - Follows n8n's INodeType architecture exactly
 * This is the starting point for all workflows when manually triggered
 */
export class ManualTriggerNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Manual Trigger',
      name: 'n8n-nodes-base.manualTrigger', // Follow n8n naming convention
      icon: 'fa:play',
      group: ['trigger'] as string[],
      version: 1,
      subtitle: 'Manually start workflow',
      description: 'Manually trigger the workflow execution',
      defaults: {
        name: 'Manual Trigger',
        color: '#00c851'
      },
      inputs: [],
      outputs: ['main'],
      properties: [
        {
          displayName: 'Execution Data',
          name: 'executionData',
          type: 'json',
          default: '{}',
          description: 'Data to pass when the workflow is triggered manually',
          placeholder: '{"key": "value"}'
        }
      ],
      trigger: true
    };

    super(description);
  }
  async execute(
    this: INodeExecutionContext
  ): Promise<INodeExecutionData[][]> {
    const executionData = this.getNodeParameter('executionData', 0, {}) as object;
    
    const returnData: INodeExecutionData[] = [
      {
        json: {
          timestamp: new Date().toISOString(),
          triggeredBy: 'manual',
          executionId: this.helpers?.constructExecutionMetaData ? 
            this.helpers.constructExecutionMetaData([], { executionId: true }) : 
            `manual_${Date.now()}`,
          data: executionData
        }
      }
    ];

    return [returnData];
  }
}

/**
 * Webhook Trigger Node - Follows n8n's INodeType architecture
 * Implements proper webhook handling with n8n patterns
 */
export class WebhookTriggerNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Webhook',
      name: 'n8n-nodes-base.webhook',
      icon: 'fa:satellite-dish',
      group: ['trigger'] as string[],
      version: 1,
      subtitle: 'Listens for HTTP requests',
      description: 'Triggers the workflow when a webhook is called',
      defaults: {
        name: 'Webhook',
        color: '#00c851'
      },
      inputs: [],
      outputs: ['main'],
      credentials: [
        {
          name: 'httpBasicAuth',
          required: false,
          displayOptions: {
            show: {
              authentication: ['basicAuth']
            }
          }
        },
        {
          name: 'httpHeaderAuth',
          required: false,
          displayOptions: {
            show: {
              authentication: ['headerAuth']
            }
          }
        }
      ],
      properties: [
        {
          displayName: 'Authentication',
          name: 'authentication',
          type: 'options',
          default: 'none',
          options: [
            { name: 'None', value: 'none' },
            { name: 'Basic Auth', value: 'basicAuth' },
            { name: 'Header Auth', value: 'headerAuth' }
          ],
          description: 'The way to authenticate'
        },
        {
          displayName: 'HTTP Method',
          name: 'httpMethod',
          type: 'options',
          default: 'GET',
          options: [
            { name: 'DELETE', value: 'DELETE' },
            { name: 'GET', value: 'GET' },
            { name: 'HEAD', value: 'HEAD' },
            { name: 'PATCH', value: 'PATCH' },
            { name: 'POST', value: 'POST' },
            { name: 'PUT', value: 'PUT' }
          ],
          description: 'The HTTP method to listen to'
        },
        {
          displayName: 'Path',
          name: 'path',
          type: 'string',
          default: '',
          placeholder: 'webhook',
          required: true,
          description: 'The path for the webhook'
        },
        {
          displayName: 'Response Mode',
          name: 'responseMode',
          type: 'options',
          default: 'onReceived',
          options: [
            { name: 'On Received', value: 'onReceived', description: 'Returns response directly' },
            { name: 'Last Node', value: 'lastNode', description: 'Returns data of the last executed node' }
          ],
          description: 'When to respond to the webhook'
        },
        {
          displayName: 'Response Code',
          name: 'responseCode',
          type: 'number',
          default: 200,
          description: 'The HTTP response code to return',
          displayOptions: {
            show: {
              responseMode: ['onReceived']
            }
          }
        },
        {
          displayName: 'Response Data',
          name: 'responseData',
          type: 'string',
          default: 'success',
          description: 'Custom response data',
          displayOptions: {
            show: {
              responseMode: ['onReceived']
            }
          }
        }
      ],
      webhook: true,
      trigger: true
    };

    super(description);
  }

  async webhook(this: INodeExecutionContext, context: any): Promise<any> {
    const responseMode = this.getNodeParameter('responseMode', 0) as string;
    const responseCode = this.getNodeParameter('responseCode', 0, 200) as number;
    const responseData = this.getNodeParameter('responseData', 0, 'success') as string;
    
    const body = context.getBodyData ? context.getBodyData() : context.body;
    const headers = context.getHeaderData ? context.getHeaderData() : context.headers;
    const query = context.getQueryData ? context.getQueryData() : context.query;

    const returnData: INodeExecutionData[] = [
      {
        json: {
          headers,
          params: context.params || {},
          query,
          body,
          webhookUrl: context.getWebhookUrl ? context.getWebhookUrl() : `${context.baseUrl}/webhook`,
          executionId: context.executionId || `webhook_${Date.now()}`
        }
      }
    ];

    if (responseMode === 'onReceived') {
      return {
        responseCode,
        data: responseData,
        workflowData: [returnData]
      };
    }

    return {
      workflowData: [returnData]
    };
  }

  async execute(): Promise<INodeExecutionData[][]> {
    // Webhook nodes don't execute in the traditional sense
    // They are triggered via HTTP requests
    return [];
  }
}

/**
 * Schedule Trigger Node - Follows n8n's cron trigger pattern
 * Uses proper polling architecture for scheduled execution
 */
export class ScheduleTriggerNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Schedule Trigger',
      name: 'n8n-nodes-base.scheduleTrigger',
      icon: 'fa:clock',
      group: ['trigger'] as string[],
      version: 1,
      subtitle: 'Triggers on schedule',
      description: 'Triggers the workflow on a schedule',
      defaults: {
        name: 'Schedule Trigger',
        color: '#00c851'
      },
      inputs: [],
      outputs: ['main'],
      properties: [
        {
          displayName: 'Trigger Interval',
          name: 'triggerInterval',
          type: 'options',
          default: 'everyMinute',
          options: [
            { name: 'Every Minute', value: 'everyMinute' },
            { name: 'Every 5 Minutes', value: 'every5Minutes' },
            { name: 'Every 10 Minutes', value: 'every10Minutes' },
            { name: 'Every 30 Minutes', value: 'every30Minutes' },
            { name: 'Every Hour', value: 'everyHour' },
            { name: 'Every Day', value: 'everyDay' },
            { name: 'Custom Cron Expression', value: 'custom' }
          ],
          description: 'How often the workflow should be triggered'
        },
        {
          displayName: 'Cron Expression',
          name: 'cronExpression',
          type: 'string',
          default: '0 * * * *',
          placeholder: '0 * * * *',
          description: 'Custom cron expression for scheduling',
          displayOptions: {
            show: {
              triggerInterval: ['custom']
            }
          }
        },
        {
          displayName: 'Timezone',
          name: 'timezone',
          type: 'string',
          default: 'UTC',
          description: 'Timezone for the schedule'
        }
      ],
      trigger: true,
      polling: true
    };

    super(description);
  }
  async poll(this: INodeExecutionContext): Promise<INodeExecutionData[][]> {
    const triggerInterval = this.getNodeParameter('triggerInterval', 0) as string;
    const timezone = this.getNodeParameter('timezone', 0) as string;
    
    // In a real implementation, this would check if it's time to trigger
    const shouldTrigger = ScheduleTriggerNode.shouldTriggerNow(triggerInterval, timezone);
    
    if (!shouldTrigger) {
      return [];
    }

    const returnData: INodeExecutionData[] = [
      {
        json: {
          timestamp: new Date().toISOString(),
          triggeredBy: 'schedule',
          interval: triggerInterval,
          timezone,
          executionId: `schedule_${Date.now()}`
        }
      }
    ];

    return [returnData];
  }

  async execute(): Promise<INodeExecutionData[][]> {
    // Schedule nodes don't execute in the traditional sense
    return [];
  }

  private static shouldTriggerNow(interval: string, _timezone: string): boolean {
    // Simplified implementation - in reality this would use a proper cron library
    const now = new Date();
    
    switch (interval) {
      case 'everyMinute':
        return now.getSeconds() === 0;
      case 'everyHour':
        return now.getMinutes() === 0 && now.getSeconds() === 0;
      case 'everyDay':
        return now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0;
      default:
        return false;
    }
  }
}

/**
 * Email Trigger Node - Follows n8n's email trigger pattern
 * Implements IMAP polling for incoming emails
 */
export class EmailTriggerNode extends BaseNode {
  constructor() {
    const description: INodeTypeDescription = {
      displayName: 'Email Trigger (IMAP)',
      name: 'n8n-nodes-base.emailReadImap',
      icon: 'fa:envelope',
      group: ['trigger'] as string[],
      version: 1,
      subtitle: 'Triggers on new emails',
      description: 'Triggers the workflow when an email is received',
      defaults: {
        name: 'Email Trigger',
        color: '#00c851'
      },
      inputs: [],
      outputs: ['main'],
      credentials: [
        {
          name: 'imap',
          required: true
        }
      ],
      properties: [
        {
          displayName: 'Mailbox Name',
          name: 'mailbox',
          type: 'string',
          default: 'INBOX',
          description: 'Name of the mailbox to read from'
        },
        {
          displayName: 'Action',
          name: 'postProcessAction',
          type: 'options',
          default: 'read',
          options: [
            { name: 'Mark as read', value: 'read' },
            { name: 'Nothing', value: 'nothing' },
            { name: 'Delete', value: 'delete' }
          ],
          description: 'What to do after the email has been received'
        },
        {
          displayName: 'Download Attachments',
          name: 'downloadAttachments',
          type: 'boolean',
          default: false,
          description: 'Whether to download attachments or not'
        }
      ],
      trigger: true,
      polling: true
    };

    super(description);
  }
  async poll(this: INodeExecutionContext): Promise<INodeExecutionData[][]> {
    const mailbox = this.getNodeParameter('mailbox', 0) as string;
    const postProcessAction = this.getNodeParameter('postProcessAction', 0) as string;
    const downloadAttachments = this.getNodeParameter('downloadAttachments', 0) as boolean;

    // In a real implementation, this would connect to IMAP and check for new emails
    const newEmails = await EmailTriggerNode.checkForNewEmails(mailbox, postProcessAction, downloadAttachments);
    
    const returnData: INodeExecutionData[] = newEmails.map((email: any) => ({
      json: {
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        timestamp: email.timestamp,
        uid: email.uid,
        attachments: email.attachments || [],
        messageId: email.messageId
      }
    }));

    return returnData.length > 0 ? [returnData] : [];
  }

  async execute(): Promise<INodeExecutionData[][]> {
    // Email trigger nodes don't execute in the traditional sense
    return [];
  }
  private static async checkForNewEmails(_mailbox: string, _postProcessAction: string, _downloadAttachments: boolean): Promise<any[]> {
    // Mock implementation - in reality would use an IMAP library like node-imap
    // Return empty array for now to avoid actual email checking
    return [];
  }
}
