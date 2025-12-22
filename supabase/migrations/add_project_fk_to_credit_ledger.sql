-- Add foreign key constraint between credit_ledger.project_id and projects.id
-- This ensures referential integrity and enables Supabase joins

-- First, clean up any orphaned project_ids (if any exist)
UPDATE credit_ledger
SET project_id = NULL
WHERE project_id IS NOT NULL
  AND project_id NOT IN (SELECT id FROM projects);

-- Add the foreign key constraint
ALTER TABLE credit_ledger
ADD CONSTRAINT credit_ledger_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES projects(id)
ON DELETE SET NULL;  -- If a project is deleted, set project_id to NULL instead of cascading delete

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_credit_ledger_project_id ON credit_ledger(project_id);

-- Comment for documentation
COMMENT ON CONSTRAINT credit_ledger_project_id_fkey ON credit_ledger IS 
'Foreign key constraint to ensure project_id references valid projects. ON DELETE SET NULL preserves transaction history.';

