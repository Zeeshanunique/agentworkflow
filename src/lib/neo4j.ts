import neo4j, { Driver, Session, SessionMode } from "neo4j-driver";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const uri = process.env.NEO4J_URI || "";
const username = process.env.NEO4J_USERNAME || "";
const password = process.env.NEO4J_PASSWORD || "";

// Validate required environment variables
if (!uri || !username || !password) {
  console.error("Neo4j configuration missing. Check your .env file.");
}

// Create a driver instance
let driver: Driver;

/**
 * Get or initialize the Neo4j driver
 */
export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      uri, 
      neo4j.auth.basic(username, password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 120 seconds
      }
    );
  }
  return driver;
}

/**
 * Close the Neo4j driver
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
  }
}

/**
 * Run a Cypher query
 */
export async function runQuery(cypher: string, params = {}): Promise<any> {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(record => {
      const obj: Record<string, any> = {};
      record.keys.forEach(key => {
        obj[key] = record.get(key);
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

/**
 * Verify the Neo4j connection
 */
export async function verifyConnection(): Promise<boolean> {
  try {
    const result = await runQuery("RETURN 1 AS result");
    return result[0].result === 1;
  } catch (error) {
    console.error("Neo4j connection error:", error);
    return false;
  }
} 