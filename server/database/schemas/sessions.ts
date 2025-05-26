import { pgTable, text, json, timestamp } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull()
});
