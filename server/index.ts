import express from "express";
import session from "express-session";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import pgSession from "connect-pg-simple";
import MemoryStore from "memorystore";
import config from "./config";
import { db, runMigrations } from "./db";
import { setupPassport } from "./middleware/auth";
import authRoutes from "./routes/auth";
import workflowsRoutes from "./routes/workflows";
import { setupWebSocketServer } from "./utils/websocket";

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use(sessionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure passport authentication
const passport = setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/workflows", workflowsRoutes);

// Static files (in production)
if (!config.isDev) {
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
