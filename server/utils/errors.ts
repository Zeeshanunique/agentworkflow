export class BaseError extends Error {
  public status: number;
  public isOperational: boolean;

  constructor(message: string, status: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class WorkflowError extends BaseError {
  public originalError?: Error;

  constructor(message: string, originalError?: Error | unknown) {
    super(message, 500);
    this.originalError = originalError instanceof Error ? originalError : undefined;
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = "Access denied") {
    super(message, 403);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409);
  }
} 