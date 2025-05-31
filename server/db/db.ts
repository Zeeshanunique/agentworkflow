import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database connection string from environment variable
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/agentworkflow';

// Create Postgres client
const client = postgres(connectionString);

// Create Drizzle ORM instance with the client and schema
export const db = drizzle(client, { schema });
