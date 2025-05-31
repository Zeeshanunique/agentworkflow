// Test file for n8n trigger node integration
import { ManualTriggerNode, WebhookTriggerNode, ScheduleTriggerNode, EmailTriggerNode } from './src/data/n8nNodes/triggers';
import { nodeRegistry } from './src/data/n8nNodeRegistry';

// Simple test function to verify node instantiation and registry integration
async function testTriggerNodes() {
  console.log('🚀 Testing n8n Trigger Node Integration...\n');

  // Test 1: Node instantiation
  console.log('1. Testing node instantiation...');
  try {
    const manualTrigger = new ManualTriggerNode();
    const webhookTrigger = new WebhookTriggerNode();
    const scheduleTrigger = new ScheduleTriggerNode();
    const emailTrigger = new EmailTriggerNode();

    console.log('✅ All trigger nodes instantiated successfully');
    console.log(`   - Manual Trigger: ${manualTrigger.description.displayName}`);
    console.log(`   - Webhook Trigger: ${webhookTrigger.description.displayName}`);
    console.log(`   - Schedule Trigger: ${scheduleTrigger.description.displayName}`);
    console.log(`   - Email Trigger: ${emailTrigger.description.displayName}`);
  } catch (error) {
    console.error('❌ Node instantiation failed:', error);
    return;
  }

  // Test 2: Registry integration
  console.log('\n2. Testing node registry integration...');
  try {
    const registeredNodes = Object.keys(nodeRegistry);
    const triggerNodes = registeredNodes.filter(name => 
      name.includes('Trigger') || name.includes('trigger')
    );

    console.log('✅ Node registry loaded successfully');
    console.log(`   - Total registered nodes: ${registeredNodes.length}`);
    console.log(`   - Trigger nodes: ${triggerNodes.join(', ')}`);
  } catch (error) {
    console.error('❌ Registry integration failed:', error);
    return;
  }

  // Test 3: Node properties validation
  console.log('\n3. Testing node properties...');
  try {
    const manualTrigger = new ManualTriggerNode();
    const description = manualTrigger.description;

    // Validate required n8n properties
    const requiredProps = ['displayName', 'name', 'group', 'version', 'description', 'inputs', 'outputs', 'properties'];
    const missingProps = requiredProps.filter(prop => !(prop in description));

    if (missingProps.length === 0) {
      console.log('✅ All required n8n properties present');
      console.log(`   - Node type: ${description.name}`);
      console.log(`   - Version: ${description.version}`);
      console.log(`   - Group: ${description.group.join(', ')}`);
      console.log(`   - Properties count: ${description.properties.length}`);
    } else {
      console.error(`❌ Missing properties: ${missingProps.join(', ')}`);
      return;
    }
  } catch (error) {
    console.error('❌ Property validation failed:', error);
    return;
  }

  // Test 4: Mock execution context
  console.log('\n4. Testing mock execution...');
  try {
    const manualTrigger = new ManualTriggerNode();
    
    // Create a mock execution context
    const mockContext = {
      getNodeParameter: (name: string, _index: number, defaultValue?: any) => {
        if (name === 'executionData') return { test: 'data' };
        return defaultValue;
      },
      helpers: {
        constructExecutionMetaData: () => `mock_execution_${Date.now()}`
      }
    };

    // Mock execution (should not throw errors)
    const result = await manualTrigger.execute.call(mockContext);
    
    console.log('✅ Mock execution completed successfully');
    console.log(`   - Result type: ${Array.isArray(result) ? 'Array' : typeof result}`);
    console.log(`   - Data items: ${result[0]?.length || 0}`);
  } catch (error) {
    console.error('❌ Mock execution failed:', error);
    return;
  }

  console.log('\n🎉 All trigger node tests passed! The n8n transformation is ready.');
}

// Export test function for use in other modules
export { testTriggerNodes };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testTriggerNodes().catch(console.error);
}
