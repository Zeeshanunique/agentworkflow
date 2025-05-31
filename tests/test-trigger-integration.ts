// Test file for n8n trigger workflow integration
import { triggerDiscoveryService, IWebhookContext, TriggerNodeType } from './src/services/triggerDiscovery';
import { 
  registerWorkflowTriggers, 
  unregisterWorkflowTriggers, 
  executeManualTrigger, 
  handleWebhookRequest 
} from './src/lib/triggerWorkflowIntegration';

async function testTriggerIntegration() {
  console.log('🚀 Testing n8n Trigger Workflow Integration...\n');

  const workflowId = 'test-workflow-1';

  console.log('1. Testing trigger registration...');
  try {
    // Register multiple trigger nodes for a workflow
    const registrationResult = await registerWorkflowTriggers(workflowId, [
      {
        nodeId: 'manual-1',
        type: 'n8n-nodes-base.manualTrigger',
        parameters: { 
          executionData: { test: true } 
        }
      },
      {
        nodeId: 'webhook-1',
        type: 'n8n-nodes-base.webhook',
        parameters: {
          httpMethod: 'POST',
          path: 'test-hook',
          authentication: 'none',
          responseMode: 'onReceived'
        }
      },
      {
        nodeId: 'schedule-1',
        type: 'n8n-nodes-base.scheduleTrigger',
        parameters: {
          triggerInterval: 'everyHour',
          timezone: 'UTC'
        }
      }
    ]);

    console.log('✅ Registration successful:', registrationResult);

    // Get statistics
    const stats = triggerDiscoveryService.getTriggerStatistics();
    console.log('✅ Trigger statistics:', stats);
  } catch (error) {
    console.error('❌ Registration failed:', error);
  }

  console.log('\n2. Testing manual trigger execution...');
  try {
    const executionResult = await executeManualTrigger(
      workflowId,
      'manual-1',
      { source: 'test', timestamp: new Date().toISOString() }
    );

    console.log('✅ Manual trigger execution result:', executionResult.triggered);
  } catch (error) {
    console.error('❌ Manual trigger execution failed:', error);
  }

  console.log('\n3. Testing webhook handling...');
  try {
    // Mock webhook context
    const webhookContext: IWebhookContext = {
      method: 'POST',
      path: 'test-hook',
      body: { data: 'test webhook payload' },
      headers: { 'content-type': 'application/json' },
      query: { test: 'true' },
      params: { id: '123' },
      baseUrl: 'http://localhost:3000'
    };

    const webhookResult = await handleWebhookRequest('test-hook', webhookContext);
    console.log('✅ Webhook handling result:', webhookResult?.triggered);
  } catch (error) {
    console.error('❌ Webhook handling failed:', error);
  }

  console.log('\n4. Testing trigger unregistration...');
  try {
    const unregistrationResult = unregisterWorkflowTriggers(workflowId);
    console.log('✅ Unregistration successful:', unregistrationResult);
  } catch (error) {
    console.error('❌ Unregistration failed:', error);
  }

  console.log('\n🎉 Trigger workflow integration tests completed!');
}

// Export test function
export { testTriggerIntegration };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testTriggerIntegration().catch(console.error);
}
