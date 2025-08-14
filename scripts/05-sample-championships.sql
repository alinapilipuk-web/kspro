-- Add sample cup championship with teams
DO $$
DECLARE
    cup_championship_id INTEGER;
BEGIN
    -- Get cup championship ID
    SELECT id INTO cup_championship_id FROM championships WHERE name = 'Кубок України' AND season = '2024-2025';
    
    IF cup_championship_id IS NOT NULL THEN
        -- Insert teams for cup
        INSERT INTO teams (name, logo, championship_id) VALUES 
        ('Динамо Київ', 'https://example.com/dynamo.png', cup_championship_id),
        ('Шахтар Донецк', 'https://example.com/shakhtar.png', cup_championship_id),
        ('Дніпро-1', 'https://example.com/dnipro.png', cup_championship_id),
        ('Ворскла Полтава', 'https://example.com/vorskla.png', cup_championship_id),
        ('Олександрія', 'https://example.com/oleksandriya.png', cup_championship_id),
        ('Зоря Луганск', 'https://example.com/zorya.png', cup_championship_id),
        ('Колос Ковалівка', 'https://example.com/kolos.png', cup_championship_id),
        ('Рух Львів', 'https://example.com/rukh.png', cup_championship_id);
        
        -- Insert cup matches
        INSERT INTO matches (round, date, home_team, away_team, home_score, away_score, is_finished, championship_id, cup_stage) VALUES 
        (1, '2024-09-15', 'Динамо Київ', 'Колос Ковалівка', 3, 1, true, cup_championship_id, '1/8 фіналу'),
        (1, '2024-09-15', 'Шахтар Донецк', 'Рух Львів', 2, 0, true, cup_championship_id, '1/8 фіналу'),
        (1, '2024-09-16', 'Дніпро-1', 'Зоря Луганск', 1, 2, true, cup_championship_id, '1/8 фіналу'),
        (1, '2024-09-16', 'Ворскла Полтава', 'Олександрія', 0, 1, true, cup_championship_id, '1/8 фіналу');
    END IF;
END $$;
