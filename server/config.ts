/**
 * Application configuration
 */
interface Config {
  port: number;
  isDev: boolean;
  dbUrl: string;
  encryptionKey: string;
  sessionSecret: string;
  corsOrigin: string | string[];
  nodeEnv: string;
  staticPath: string;
  sessionConfig: {
    secret: string;
    resave: boolean;
    saveUninitialized: boolean;
    cookie: {
      secure: boolean;
      maxAge: number;
    };
  };
}

// Load environment variables
const isDev = process.env.NODE_ENV !== 'production';

// Default configuration
const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  isDev,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/agentworkflow',
  encryptionKey: process.env.ENCRYPTION_KEY || '00000000000000000000000000000000', // Default for dev only
  sessionSecret: process.env.SESSION_SECRET || 'agentworkflow-session-secret',
  corsOrigin: isDev ? 'http://localhost:5173' : process.env.CORS_ORIGIN || '',
  staticPath: process.env.STATIC_PATH || 'dist',
  sessionConfig: {
    secret: process.env.SESSION_SECRET || 'agentworkflow-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: !isDev,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }
};

// Log a warning if using default encryption key in production
if (!isDev && config.encryptionKey === '00000000000000000000000000000000') {
  console.warn('WARNING: Using default encryption key in production. Set ENCRYPTION_KEY env variable.');
}

export default config;
