// filepath: /workspaces/agentworkflow/drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/agentworkflow',
  }
} satisfies Config;
