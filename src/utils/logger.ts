type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private readonly maxLogSize = 1000;
  private logs: LogEntry[] = [];
  private readonly isDev = process.env.NODE_ENV === 'development';

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    };
  }

  private addLog(entry: LogEntry) {
    // Keep log size under control
    if (this.logs.length >= this.maxLogSize) {
      this.logs = this.logs.slice(-Math.floor(this.maxLogSize / 2));
    }
    this.logs.push(entry);

    // In development, also log to console
    if (this.isDev) {
      const consoleArgs = [
        `%c${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}`,
        `color: ${this.getLogColor(entry.level)}`
      ];
      if (entry.data) consoleArgs.push(entry.data);
      console.log(...consoleArgs);
    }
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return '#6b7280';
      case 'info': return '#2563eb';
      case 'warn': return '#d97706';
      case 'error': return '#dc2626';
      default: return '#000000';
    }
  }

  public debug(message: string, data?: any) {
    this.addLog(this.createLogEntry('debug', message, data));
  }

  public info(message: string, data?: any) {
    this.addLog(this.createLogEntry('info', message, data));
  }

  public warn(message: string, data?: any) {
    this.addLog(this.createLogEntry('warn', message, data));
  }

  public error(message: string, data?: any) {
    const entry = this.createLogEntry('error', message, data);
    this.addLog(entry);

    // Send error to server in production
    if (!this.isDev) {
      this.sendErrorToServer(entry).catch(console.error);
    }
  }

  private async sendErrorToServer(entry: LogEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to send error to server:', error);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger(); 