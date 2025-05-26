import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { workflows } from "../schemas/workflows";
import { z } from "zod";

// Select schema: for reading workflows from the database
export const selectWorkflowSchema = createSelectSchema(workflows);

// Insert schema: for creating a new workflow (used on insert)
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Optional version (e.g., for PATCH)
export const updateWorkflowSchema = insertWorkflowSchema.partial();

export type Workflow = z.infer<typeof selectWorkflowSchema>;
export type NewWorkflow = z.infer<typeof insertWorkflowSchema>;
export type UpdateWorkflow = z.infer<typeof updateWorkflowSchema>;
