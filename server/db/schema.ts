import { pgTable, serial, text, timestamp, integer, json, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatar: text("avatar_url"),
  role: text("role").default("user").notNull(),
  preferences: jsonb("preferences").default({}).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull().references(() => users.id),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  version: integer("version").default(1).notNull(),
  tags: jsonb("tags").default([]).notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  status: text("status").default("draft").notNull(),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const workflowVersions = pgTable("workflow_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id),
  version: integer("version").notNull(),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id)
});

export const workflowExecutions = pgTable("workflow_executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  mode: text("mode").notNull(), // manual, webhook, schedule
  inputData: jsonb("input_data").default({}).notNull(),
  outputData: jsonb("output_data"),
  error: text("error"),
  executionTime: integer("execution_time"), // in milliseconds
  nodeResults: jsonb("node_results"), // results from each node
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull()
});

export const workflowCollaborators = pgTable("workflow_collaborators", {
  id: serial("id").primaryKey(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// N8n-style credential management
export const credentials = pgTable("credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  encryptedData: text("encrypted_data").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Webhook endpoints for webhook triggers
export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id),
  path: text("path").notNull().unique(),
  method: text("method").notNull().default("POST"),
  isActive: boolean("is_active").notNull().default(true),
  authType: text("auth_type").default("none"),
  authConfig: jsonb("auth_config").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Shared credentials for access control
export const sharedCredentials = pgTable("shared_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  credentialId: uuid("credential_id").notNull().references(() => credentials.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").notNull().references(() => users.id)
});

// Node packages to track installed community nodes
export const installedPackages = pgTable("installed_packages", {
  id: serial("id").primaryKey(),
  packageName: text("package_name").notNull().unique(),
  version: text("version").notNull(),
  installedAt: timestamp("installed_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  enabled: boolean("enabled").default(true).notNull()
});

// Individual nodes from installed packages
export const installedNodes = pgTable("installed_nodes", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").notNull().references(() => installedPackages.id, { onDelete: 'cascade' }),
  nodeName: text("node_name").notNull(),
  nodeType: text("node_type").notNull(),
  enabled: boolean("enabled").default(true).notNull()
});

// Workflow schedules for scheduled executions
export const workflowSchedules = pgTable("workflow_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id),
  cronExpression: text("cron_expression").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  isActive: boolean("is_active").notNull().default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertWorkflowSchema = createInsertSchema(workflows);
export const selectWorkflowSchema = createSelectSchema(workflows);

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const registerSchema = loginSchema.extend({
  email: z.string().email("Please enter a valid email"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Workflow = z.infer<typeof selectWorkflowSchema>;
export type NewWorkflow = z.infer<typeof insertWorkflowSchema>;

export const WorkflowStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived"
} as const;

export const ExecutionStatus = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled"
} as const;

export const CollaboratorRole = {
  VIEWER: "viewer",
  EDITOR: "editor",
  ADMIN: "admin"
} as const;
