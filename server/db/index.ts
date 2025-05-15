import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from './schema';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Configure Neon serverless driver to work with Node.js
// See https://neon.tech/docs/serverless/serverless-driver
neonConfig.fetchConnectionCache = true;
// Set WebSocket implementation for Neon in Node.js environment
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create drizzle database instance
export const db = drizzle(pool, { schema });

// Run migrations - only in development
export async function runMigrations() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Running migrations...');
    try {
      await migrate(db, { migrationsFolder: 'drizzle' });
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }
}
