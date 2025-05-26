// Check if we're in browser context
const isBrowser = typeof window !== 'undefined';

// Log environment
console.log(`Running in ${isBrowser ? 'browser' : 'Node.js'} environment`);

if (isBrowser) {
  // Browser environment
  console.log('Browser environment variables:');
  console.log('VITE_NEO4J_URI:', import.meta.env.VITE_NEO4J_URI);
  console.log('VITE_LANGCHAIN_API_KEY:', import.meta.env.VITE_LANGCHAIN_API_KEY ? 'defined' : 'undefined');
} else {
  // Node.js environment
  console.log('Node.js environment variables:');
  console.log('NEO4J_URI:', process.env.NEO4J_URI);
  console.log('LANGCHAIN_API_KEY:', process.env.LANGCHAIN_API_KEY ? 'defined' : 'undefined');
}

// Test the langsmith.ts file
import('./src/lib/langchain/langsmith.js')
  .then(module => {
    console.log('LangSmith module loaded successfully');
    try {
      const initialized = module.initLangSmith();
      console.log('LangSmith initialization result:', initialized);
    } catch (error) {
      console.error('Error initializing LangSmith:', error);
    }
  })
  .catch(error => {
    console.error('Error loading LangSmith module:', error);
  }); 