import { db } from "../../db";
import { workflows } from "../../database/schemas/workflows";
import { eq, and } from "drizzle-orm";
import type { NewWorkflow, Workflow, UpdateWorkflow } from "../../database/validators/workflowValidators";

function castWorkflowJsonFields(w: any): Workflow {
  return {
    ...w,
    nodes: w.nodes as any,         // Replace `any` with your Json type if you have one
    connections: w.connections as any,
  };
}

export async function getUserWorkflows(userId: number): Promise<Workflow[]> {
  const raw = await db.query.workflows.findMany({
    where: eq(workflows.userId, userId),
    orderBy: (w, { desc }) => [desc(w.updatedAt)],
  });
  return raw.map(castWorkflowJsonFields);
}

export async function getPublicWorkflows(): Promise<Workflow[]> {
  const raw = await db.query.workflows.findMany({
    where: eq(workflows.isPublic, true),
    orderBy: (w, { desc }) => [desc(w.updatedAt)],
  });
  return raw.map(castWorkflowJsonFields);
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, id),
  });
  if (!workflow) return null;
  return castWorkflowJsonFields(workflow);
}

export async function createWorkflow(data: NewWorkflow & { userId: number }): Promise<Workflow> {
  const [workflow] = await db.insert(workflows).values(data).returning();
  return castWorkflowJsonFields(workflow);
}

export async function updateWorkflow(id: string, userId: number, data: UpdateWorkflow): Promise<Workflow | null> {
  const [updatedWorkflow] = await db.update(workflows)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(workflows.id, id), eq(workflows.userId, userId)))
    .returning();

  if (!updatedWorkflow) return null;
  return castWorkflowJsonFields(updatedWorkflow);
}

export async function deleteWorkflow(id: string, userId: number): Promise<void> {
  await db.delete(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
}
