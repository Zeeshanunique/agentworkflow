import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default port is 3000 or the value specified in the environment variable
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Session secret
const SESSION_SECRET = process.env.SESSION_SECRET || "development_secret";

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL;

// Path to static assets
const STATIC_PATH = path.join(__dirname, "..", "..", "dist");

// Environment mode
const NODE_ENV = process.env.NODE_ENV || "development";
const isDev = NODE_ENV === "development";

// Session configuration
const SESSION_CONFIG = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: !isDev, // Use secure cookies in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
};

export default {
  port: PORT,
  sessionSecret: SESSION_SECRET,
  databaseUrl: DATABASE_URL,
  staticPath: STATIC_PATH,
  isDev,
  nodeEnv: NODE_ENV,
  sessionConfig: SESSION_CONFIG,
};
