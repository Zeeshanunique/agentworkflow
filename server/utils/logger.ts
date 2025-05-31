import winston from "winston";
import config from "../config";

const { combine, timestamp, printf, colorize, errors } = winston.format;

interface LogInfo extends winston.Logform.TransformableInfo {
  timestamp?: string;
  stack?: string;
}

// Custom log format
const logFormat = printf((info: LogInfo) => {
  const { level, message, timestamp: ts, stack } = info;
  return `${ts} ${level}: ${stack || message}`;
});

// Create the logger
export const logger = winston.createLogger({
  level: config.isDev ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console transport with colors for development
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    }),
    // File transport for errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Add request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("user-agent"),
      ip: req.ip
    });
  });
  next();
}; 