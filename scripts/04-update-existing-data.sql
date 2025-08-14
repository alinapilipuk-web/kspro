-- Update existing data with championship_id
UPDATE teams SET championship_id = 1 WHERE championship_id IS NULL;
UPDATE matches SET championship_id = 1 WHERE championship_id IS NULL;
UPDATE players SET championship_id = 1 WHERE championship_id IS NULL;

-- Update existing data if needed
UPDATE championships SET is_active = true WHERE name = 'Чемпіонат України' AND season = '2024-2025';

-- Make championship_id required
ALTER TABLE teams ALTER COLUMN championship_id SET NOT NULL;
ALTER TABLE matches ALTER COLUMN championship_id SET NOT NULL;
ALTER TABLE players ALTER COLUMN championship_id SET NOT NULL;
