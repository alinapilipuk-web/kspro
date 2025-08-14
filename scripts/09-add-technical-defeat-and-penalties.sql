-- Add technical defeat and penalty shootout columns to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS is_technical_defeat BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS technical_winner VARCHAR(255),
ADD COLUMN IF NOT EXISTS penalty_home INTEGER,
ADD COLUMN IF NOT EXISTS penalty_away INTEGER,
ADD COLUMN IF NOT EXISTS penalty_winner VARCHAR(255);

-- Update existing matches to have default values
UPDATE matches SET is_technical_defeat = false WHERE is_technical_defeat IS NULL;

-- Update the calculateLeagueTable function to handle technical defeats
CREATE OR REPLACE FUNCTION calculate_league_table(championship_id_param INTEGER)
RETURNS TABLE (
    name TEXT,
    games INTEGER,
    wins INTEGER,
    draws INTEGER,
    losses INTEGER,
    gf INTEGER,
    ga INTEGER,
    pts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH team_stats AS (
        SELECT 
            t.name as team_name,
            -- Games played
            COUNT(m.id) as games_played,
            
            -- Goals for and against
            COALESCE(SUM(CASE 
                WHEN m.home_team = t.name AND NOT m.is_technical_defeat THEN m.home_score
                WHEN m.away_team = t.name AND NOT m.is_technical_defeat THEN m.away_score
                ELSE 0
            END), 0) as goals_for,
            
            COALESCE(SUM(CASE 
                WHEN m.home_team = t.name AND NOT m.is_technical_defeat THEN m.away_score
                WHEN m.away_team = t.name AND NOT m.is_technical_defeat THEN m.home_score
                ELSE 0
            END), 0) as goals_against,
            
            -- Wins (including technical wins)
            COUNT(CASE 
                WHEN (m.home_team = t.name AND m.home_score > m.away_score AND NOT m.is_technical_defeat) OR
                     (m.away_team = t.name AND m.away_score > m.home_score AND NOT m.is_technical_defeat) OR
                     (m.is_technical_defeat AND m.technical_winner = t.name)
                THEN 1 
            END) as team_wins,
            
            -- Draws (no draws in technical defeats)
            COUNT(CASE 
                WHEN m.home_score = m.away_score AND NOT m.is_technical_defeat AND
                     (m.home_team = t.name OR m.away_team = t.name)
                THEN 1 
            END) as team_draws,
            
            -- Losses (including technical losses)
            COUNT(CASE 
                WHEN (m.home_team = t.name AND m.home_score < m.away_score AND NOT m.is_technical_defeat) OR
                     (m.away_team = t.name AND m.away_score < m.home_score AND NOT m.is_technical_defeat) OR
                     (m.is_technical_defeat AND m.technical_winner != t.name AND (m.home_team = t.name OR m.away_team = t.name))
                THEN 1 
            END) as team_losses
            
        FROM teams t
        LEFT JOIN matches m ON (m.home_team = t.name OR m.away_team = t.name) 
            AND m.is_finished = true 
            AND m.championship_id = championship_id_param
        WHERE t.championship_id = championship_id_param
        GROUP BY t.name
    )
    SELECT 
        ts.team_name,
        ts.games_played::INTEGER,
        ts.team_wins::INTEGER,
        ts.team_draws::INTEGER,
        ts.team_losses::INTEGER,
        ts.goals_for::INTEGER,
        ts.goals_against::INTEGER,
        (ts.team_wins * 3 + ts.team_draws)::INTEGER as points
    FROM team_stats ts
    ORDER BY points DESC, (ts.goals_for - ts.goals_against) DESC, ts.goals_for DESC;
END;
$$ LANGUAGE plpgsql;
