import type { Request } from "express";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      createdAt: Date;
      updatedAt: Date;
    }

    interface Request {
      user?: User;  // optional because sometimes unauthenticated
    }
  }
}
