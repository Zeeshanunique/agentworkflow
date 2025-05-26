import express from "express";
import session from "express-session";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import pgSession from "connect-pg-simple";
import MemoryStore from "memorystore";
import cors from "cors";
import config from "./config";
import { db, runMigrations } from "./db";
import { setupPassport } from "./middleware/auth";
import apiRoutes from "./api/routes"; // ✅ unified route import
import { setupWebSocketServer } from "./utils/websocket";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Session store
let sessionStore;
if (config.isDev) {
  const MemoryStoreSession = MemoryStore(session);
  sessionStore = new MemoryStoreSession({ checkPeriod: 86400000 });
} else {
  const PgStore = pgSession(session);
  const pool = {
    query: (...args: any[]) => (db as any).$client.query(...args),
  };
  sessionStore = new PgStore({
    pool: pool as any,
    tableName: "sessions",
  });
}

const sessionMiddleware = session({
  store: sessionStore,
  ...config.sessionConfig,
});

// Middleware
if (config.isDev) {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
}

app.use(sessionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const passport = setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// ✅ Use combined routes
app.use("/api", apiRoutes);

// Static/Dev routes
if (config.isDev) {
  app.get("/", (_, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Agent Workflow - Dev</title></head>
      <body>
        <h1>API Server Running</h1>
        <ul>
          <li><a href="/api/auth">/api/auth</a></li>
          <li><a href="/api/workflows">/api/workflows</a></li>
        </ul>
      </body>
      </html>
    `);
  });
} else {
  app.use(express.static(config.staticPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(config.staticPath, "index.html"));
  });
}

// WebSocket server
const wss = new WebSocketServer({ noServer: true });
setupWebSocketServer(wss);
httpServer.on("upgrade", (req, socket, head) => {
  const url = req.url || "/";
  const pathname = new URL(url, "http://localhost").pathname;

  if (pathname === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

// Start server
const startServer = async () => {
  try {
    if (config.isDev) await runMigrations();
    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port} (${config.nodeEnv})`);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = () => {
  console.log("Shutting down...");
  httpServer.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
