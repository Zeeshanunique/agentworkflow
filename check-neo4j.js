const neo4j = require('neo4j-driver');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const uri = process.env.NEO4J_URI || '';
const username = process.env.NEO4J_USERNAME || '';
const password = process.env.NEO4J_PASSWORD || '';

console.log(`Attempting to connect to Neo4j at ${uri}`);
console.log(`Using username: ${username}`);
console.log(`Password length: ${password.length}`);

async function checkConnection() {
  let driver = null;
  let session = null;
  
  try {
    // Create driver
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000,
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000,
        encrypted: true,
        trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES'
      }
    );
    
    console.log('Driver created successfully');
    
    // Test connection with a simple query
    session = driver.session();
    console.log('Session created successfully');
    
    const result = await session.run('RETURN 1 AS result');
    console.log('Query executed successfully');
    console.log(`Result: ${result.records[0].get('result')}`);
    
    return true;
  } catch (error) {
    console.error('Connection error:', error);
    return false;
  } finally {
    if (session) {
      await session.close();
    }
    if (driver) {
      await driver.close();
    }
  }
}

checkConnection()
  .then(success => {
    console.log(`Connection test ${success ? 'passed' : 'failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  }); 