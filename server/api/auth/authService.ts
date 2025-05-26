import bcrypt from "bcryptjs";
import { db } from "../../db";
import { users } from "../../database/schemas/users";
import { eq, or } from "drizzle-orm";

export async function findOrCreateUser(
  username: string,
  email: string,
  passwordHash?: string,
  create: boolean = false
) {
  const existingUser = await db.query.users.findFirst({
    where: or(eq(users.username, username), eq(users.email, email)),
  });

  if (existingUser || !create) {
    return existingUser;
  }

  if (!passwordHash) {
    throw new Error("Password hash is required to create a new user");
  }

  const [newUser] = await db
  .insert(users)
  .values({ username, email, passwordHash })
  .returning({
    id: users.id,
    username: users.username,
    email: users.email,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  });


  return newUser;
}


export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}
