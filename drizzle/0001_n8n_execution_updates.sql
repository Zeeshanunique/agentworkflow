-- Update workflow_executions table to support n8n-style execution tracking

-- Drop the old table if it exists
DROP TABLE IF EXISTS workflow_executions CASCADE;

-- Create the new workflow_executions table
CREATE TABLE workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  mode TEXT NOT NULL CHECK (mode IN ('manual', 'webhook', 'schedule')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB,
  error TEXT,
  execution_time INTEGER, -- in milliseconds
  node_results JSONB, -- results from each node execution
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_start_time ON workflow_executions(start_time DESC);
CREATE INDEX idx_workflow_executions_mode ON workflow_executions(mode);

-- Add credentials table for n8n-style credential management
CREATE TABLE IF NOT EXISTS credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  encrypted_data TEXT NOT NULL, -- encrypted credential data
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(name, user_id) -- user can't have duplicate credential names
);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_type ON credentials(type);

-- Add webhook endpoints table for webhook triggers
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  path TEXT NOT NULL UNIQUE,
  method TEXT NOT NULL DEFAULT 'POST',
  is_active BOOLEAN NOT NULL DEFAULT true,
  auth_type TEXT DEFAULT 'none', -- none, basic, bearer
  auth_config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_webhook_endpoints_workflow_id ON webhook_endpoints(workflow_id);
CREATE INDEX idx_webhook_endpoints_path ON webhook_endpoints(path);
CREATE UNIQUE INDEX idx_webhook_endpoints_path_method ON webhook_endpoints(path, method);

-- Add workflow schedules table for scheduled executions
CREATE TABLE IF NOT EXISTS workflow_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  cron_expression TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_workflow_schedules_workflow_id ON workflow_schedules(workflow_id);
CREATE INDEX idx_workflow_schedules_next_run ON workflow_schedules(next_run) WHERE is_active = true;
