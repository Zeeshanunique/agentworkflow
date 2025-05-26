import { pgTable, uuid, text, json, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull().references(() => users.id),
  nodes: json("nodes").notNull(),
  connections: json("connections").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
