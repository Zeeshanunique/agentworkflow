import express from "express";
import passport from "passport";
import { db } from "../db";
import { users } from "../db/schema";
import { loginSchema, registerSchema } from "../db/schema";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcryptjs";

const router = express.Router();

// Login route
router.post("/login", (req, res, next) => {
  try {
    // Validate request body against schema
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ error: validationError.message });
    }

    // Use passport to authenticate
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ error: info.message || "Authentication failed" });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        return res.json({ 
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      });
    })(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Registration route
router.post("/register", async (req, res, next) => {
  try {
    // Validate request body against schema
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ error: validationError.message });
    }
    
    const { username, email, password } = req.body;
    
    // Check if username or email already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { or, eq }) => or(
        eq(users.username, username),
        eq(users.email, email)
      )
    });
    
    if (existingUser) {
      return res.status(400).json({
        error: "Username or email already exists"
      });
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create the user
    const [newUser] = await db.insert(users).values({
      username,
      email,
      passwordHash
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt
    });
    
    // Log the user in
    req.login({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    }, (err) => {
      if (err) {
        return next(err);
      }
      
      return res.status(201).json({
        message: "Registration successful",
        user: newUser
      });
    });
  } catch (error) {
    next(error);
  }
});

// Logout route
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  res.json({ user: req.user });
});

export default router;
