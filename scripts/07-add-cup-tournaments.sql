-- Add tournament type to championships
ALTER TABLE championships ADD COLUMN IF NOT EXISTS tournament_type VARCHAR(20) DEFAULT 'league';
ALTER TABLE championships ADD COLUMN IF NOT EXISTS cup_stage VARCHAR(50) DEFAULT NULL;

-- Add time to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_time TIME DEFAULT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS cup_stage VARCHAR(50) DEFAULT NULL; -- Ensure matches table has cup_stage column

-- Create table for match goals (goal scorers)
CREATE TABLE IF NOT EXISTS match_goals (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  minute INTEGER,
  goal_type VARCHAR(20) DEFAULT 'regular', -- regular, penalty, own_goal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for match_goals
ALTER TABLE match_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on match_goals" ON match_goals FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage match_goals" ON match_goals FOR ALL USING (auth.role() = 'authenticated');

-- Update existing championships
UPDATE championships SET tournament_type = 'league' WHERE tournament_type IS NULL;

-- Ensure cup tournaments have proper structure
UPDATE matches SET cup_stage = '1/8 фіналу' 
WHERE championship_id IN (SELECT id FROM championships WHERE tournament_type = 'cup') 
AND cup_stage IS NULL;

-- Add sample cup tournament
INSERT INTO championships (name, season, is_active, tournament_type) VALUES
('Кубок KS Liga', '2025', false, 'cup')
ON CONFLICT (name) DO NOTHING;
