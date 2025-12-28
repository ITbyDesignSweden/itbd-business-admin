-- Migration: Add prompt_type to ai_prompts
-- Enables multiple active prompts for different functions

-- Create an enum for prompt types if you want strictness, 
-- but for flexibility we'll use text with a check constraint for now.
ALTER TABLE ai_prompts 
ADD COLUMN IF NOT EXISTS prompt_type text DEFAULT 'customer-chat';

-- Update existing default prompt to have the correct type
UPDATE ai_prompts SET prompt_type = 'customer-chat' WHERE prompt_type IS NULL OR name = 'default_sales_architect';

-- Drop the old unique constraint on name if it exists (might want multiple versions of same name in different types)
-- Actually, name is unique in the original migration. Let's keep it unique for now or make it unique per type.
-- For now, let's just make name unique globally but type helps filtering.

-- Update the index for active prompts to be per type
DROP INDEX IF EXISTS idx_ai_prompts_active;
CREATE INDEX idx_ai_prompts_active_per_type ON ai_prompts(prompt_type, is_active) WHERE is_active = true;

COMMENT ON COLUMN ai_prompts.prompt_type IS 'Kategorisering av prompt (t.ex. customer-chat, lead-analysis, internal-spec)';

