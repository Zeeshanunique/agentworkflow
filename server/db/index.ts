import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import * as sessionsSchema from "../database/schemas/sessions";
import * as usersSchema from "../database/schemas/users";
import * as workflowsSchema from "../database/schemas/workflows";
import config from "../config";
import ws from "ws";

// Configure Neon for Node.js
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = ws;

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({ connectionString: config.databaseUrl });

// Combine all schema modules into one object
const schema = {
  ...sessionsSchema,
  ...usersSchema,
  ...workflowsSchema,
};

// Initialize Drizzle with combined schema
export const db = drizzle(pool, { schema });

// Run database migrations (dev only)
export async function runMigrations() {
  if (config.isDev) {
    console.log("🛠 Running database migrations...");
    try {
      await migrate(db, { migrationsFolder: "drizzle" });
      console.log("✅ Migrations completed successfully");
    } catch (err) {
      console.error("❌ Migration failed:", err);
      throw err;
    }
  }
}
