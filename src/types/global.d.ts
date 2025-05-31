// Global type declarations for the project

// Declare server module imports to help TypeScript resolve them
declare module '*/db/db' {
  import { DrizzleClient } from 'drizzle-orm/postgres-js';
  export const db: DrizzleClient;
}

// Declare other commonly used modules that might need augmentation
declare module '*/utils/logger' {
  import winston from 'winston';
  export const logger: winston.Logger;
  export function requestLogger(req: any, res: any, next: any): void;
}

declare module '*/utils/encryption' {
  export const encryptionService: {
    encrypt: (data: any, associatedData?: string) => string;
    decrypt: (encryptedData: string, associatedData?: string) => any;
  };
}
