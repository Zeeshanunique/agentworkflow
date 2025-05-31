import dotenv from "dotenv";

// Load environment variables first before any other imports
dotenv.config();

import express from "express";
import session from "express-session";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import pgSession from "connect-pg-simple";
import MemoryStore from "memorystore";
import cors from "cors";
import config from "./config";
import { db, runMigrations } from "./db";
import { setupPassport } from "./middleware/auth";
import authRoutes from "./routes/auth";
import workflowsRoutes from "./routes/workflows";
import workflowApiRoutes from "./api/workflow";
import { setupWebSocketServer } from "./utils/websocket";
import { initLangSmith } from "./lib/langsmith";
import { handleMetrics } from "./api/metrics";

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Configure session store based on environment
let sessionStore;
if (config.isDev) {
  // Use memory store for development
  const MemoryStoreSession = MemoryStore(session);
  sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000 // Prune expired entries every 24h
  });
} else {
  // Use PostgreSQL for production
  const PgStore = pgSession(session);
  // Create a native pool connection that pgSession can use
  const pool = {
    query: (...args: any[]) => (db as any).$client.query(...args),
  };
  sessionStore = new PgStore({
    pool: pool as any,
    tableName: "sessions"
  });
}

// Configure session middleware
const sessionMiddleware = session({
  store: sessionStore,
  ...config.sessionConfig
});

// Configure CORS for development
if (config.isDev) {
  app.use(cors({
    origin: 'http://localhost:5173', // Vite dev server default port
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}

app.use(sessionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure passport authentication
const passport = setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use("/api/auth", authRoutes);
app.use("/workflows", workflowsRoutes);
app.use("/api/workflows", workflowApiRoutes);
app.post("/api/metrics", handleMetrics);

// Static files handling
if (config.isDev) {
  // In development mode, add a simple route for the root path
  app.get("/", (_, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Agent Workflow - Development</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; }
            .container { background-color: #f9f9f9; border-radius: 5px; padding: 20px; }
            .info { margin-bottom: 20px; }
            code { background-color: #eee; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
            ul { margin-top: 10px; }
            li { margin-bottom: 8px; }
            .api-link { color: #0066cc; text-decoration: none; }
            .api-link:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Agent Workflow API Server</h1>
            <div class="info">
              <p>The API server is running successfully in development mode.</p>
              <p>Available API endpoints:</p>
              <ul>
                <li><a href="/api/auth" class="api-link">/api/auth</a> - Authentication endpoints</li>
                <li><a href="/api/workflows" class="api-link">/api/workflows</a> - Workflow management endpoints</li>
                <li><a href="/api/workflows" class="api-link">/api/workflows</a> - PostgreSQL-based workflow endpoints</li>
              </ul>
            </div>
            <div class="info">
              <p>To run the frontend development server:</p>
              <ol>
                <li>Open a new terminal</li>
                <li>Run <code>npm run dev:client</code> or add this script to your package.json</li>
              </ol>
              <p>Then access the frontend at: <a href="http://localhost:5173" class="api-link">http://localhost:5173</a></p>
            </div>
          </div>
        </body>
      </html>
    `);
  });
} else {
  // In production mode, serve static files
  app.use(express.static(config.staticPath));
  
  // Serve index.html for all routes except API
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(config.staticPath, "index.html"));
  });
}

// Setup WebSocket server for real-time collaboration
const wss = new WebSocketServer({ noServer: true });
setupWebSocketServer(wss);

// Upgrade HTTP connection to WebSocket when requested
httpServer.on("upgrade", (request, socket, head) => {
  // Make sure request.url exists before creating a URL
  const url = request.url || "/";
  const pathname = new URL(url, "http://localhost").pathname;
  
  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start the server
const startServer = async () => {
  try {
    // Run database migrations in development
    if (config.isDev) {
      await runMigrations();
    }
      // Initialize LangSmith
    initLangSmith();
    
    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
const shutdown = () => {
  console.log("Shutting down gracefully...");
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
