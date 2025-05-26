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
    try {
      console.log(`Attempting to connect to Neo4j at ${uri}`);
      // Using simpler connection approach - no additional options
      driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
      console.log("Neo4j driver created successfully");
    } catch (error) {
      console.error("Failed to create Neo4j driver:", error);
      // Return a dummy driver that will throw clear errors when used
      return {
        session: () => {
          throw new Error("Neo4j connection failed. Please check your connection details.");
        }
      } as any;
    }
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
  } catch (error) {
    console.error("Error running Neo4j query:", error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Verify the Neo4j connection
 */
export async function verifyConnection(): Promise<boolean> {
  try {
    console.log("Verifying Neo4j connection...");
    const driver = getDriver();
    const serverInfo = await driver.getServerInfo();
    console.log(`Neo4j connection verified: Success`);
    console.log(`Connected to Neo4j ${serverInfo.agent}`);
    return true;
  } catch (error) {
    console.error("Neo4j connection error:", error);
    return false;
  }
} 