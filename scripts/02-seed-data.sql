-- Insert sample championship
INSERT INTO championships (name, season, is_active, tournament_type) VALUES 
('Чемпіонат України', '2024-2025', true, 'league');

-- Get the championship ID
DO $$
DECLARE
    championship_id INTEGER;
BEGIN
    SELECT id INTO championship_id FROM championships WHERE name = 'Чемпіонат України' AND season = '2024-2025';
    
    -- Insert sample teams
    INSERT INTO teams (name, logo, championship_id) VALUES 
    ('Динамо Київ', 'https://example.com/dynamo.png', championship_id),
    ('Шахтар Донецк', 'https://example.com/shakhtar.png', championship_id),
    ('Дніпро-1', 'https://example.com/dnipro.png', championship_id),
    ('Ворскла Полтава', 'https://example.com/vorskla.png', championship_id);
    
    -- Insert sample matches
    INSERT INTO matches (round, date, home_team, away_team, home_score, away_score, is_finished, championship_id) VALUES 
    (1, '2024-08-15', 'Динамо Київ', 'Шахтар Донецк', 2, 1, true, championship_id),
    (1, '2024-08-15', 'Дніпро-1', 'Ворскла Полтава', 0, 0, true, championship_id),
    (2, '2024-08-22', 'Шахтар Донецк', 'Дніпро-1', null, null, false, championship_id),
    (2, '2024-08-22', 'Ворскла Полтава', 'Динамо Київ', null, null, false, championship_id);
    
    -- Insert sample players
    INSERT INTO players (name, team, goals, championship_id) VALUES 
    ('Андрій Ярмоленко', 'Динамо Київ', 5, championship_id),
    ('Георгій Судаков', 'Шахтар Донецк', 3, championship_id),
    ('Олександр Пихаленок', 'Дніпро-1', 2, championship_id),
    ('Ігор Пердута', 'Ворскла Полтава', 1, championship_id);
END $$;
