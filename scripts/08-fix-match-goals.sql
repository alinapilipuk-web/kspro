-- Fix match_goals table structure if needed
ALTER TABLE match_goals 
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(20) DEFAULT 'regular' 
CHECK (goal_type IN ('regular', 'penalty', 'own_goal'));

-- Update existing records
UPDATE match_goals SET goal_type = 'regular' WHERE goal_type IS NULL;
