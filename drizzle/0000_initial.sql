CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "full_name" TEXT,
  "avatar_url" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "preferences" JSONB NOT NULL DEFAULT '{}',
  "last_login" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "workflows" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "nodes" JSONB NOT NULL,
  "edges" JSONB NOT NULL,
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "tags" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "last_run" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "workflow_versions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflow_id" UUID NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "nodes" JSONB NOT NULL,
  "edges" JSONB NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" INTEGER NOT NULL REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "workflow_executions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflow_id" UUID NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "started_at" TIMESTAMP NOT NULL,
  "completed_at" TIMESTAMP,
  "error" TEXT,
  "logs" JSONB NOT NULL DEFAULT '[]',
  "results" JSONB,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "triggered_by" INTEGER NOT NULL REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" TEXT PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "workflow_collaborators" (
  "id" SERIAL PRIMARY KEY,
  "workflow_id" UUID NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "role" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_workflows_user_id" ON "workflows"("user_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_versions_workflow_id" ON "workflow_versions"("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_executions_workflow_id" ON "workflow_executions"("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_collaborators_workflow_id" ON "workflow_collaborators"("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_workflow_collaborators_user_id" ON "workflow_collaborators"("user_id");

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_collaborators_updated_at
    BEFORE UPDATE ON workflow_collaborators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 