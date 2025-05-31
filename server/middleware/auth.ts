import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

export function setupPassport() {
  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find user in database
        const user = await db.query.users.findFirst({
          where: eq(users.username, username)
        });

        // No user found with that username
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
          return done(null, false, { message: "Incorrect password" });
        }

        // Success - return user without password hash
        const { passwordHash, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user to the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id)
      });

      if (!user) {
        return done(null, false);
      }

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  return passport;
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Export an alias for isAuthenticated for compatibility with our new code
export const authenticateUser = isAuthenticated;
