import { Request, Response, NextFunction } from "express";
import { fromZodError } from "zod-validation-error";
import { loginSchema, registerSchema } from "../../database/validators/userValidators";
import {
  findOrCreateUser,
  hashPassword,
} from "./authService";

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
  err: any,
  user: any,
  info: any
) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ error: validationError.message });
    }

    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || "Authentication failed" });

    req.login(user, (err) => {
      if (err) return next(err);
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ error: validationError.message });
    }

    const { username, email, password } = req.body;

    // Check if user exists without creating
    const existingUser = await findOrCreateUser(username, email);
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const newUser = await findOrCreateUser(username, email, passwordHash, true);

    if (!newUser) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    req.login(newUser, (err) => {
      if (err) return next(err);
      res.status(201).json({
        message: "Registration successful",
        user: newUser,
      });
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
};

export const getMeController = (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({ user: req.user });
};
