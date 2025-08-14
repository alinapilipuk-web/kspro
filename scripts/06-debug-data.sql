-- Debug queries to check data
SELECT 'Championships:' as info;
SELECT * FROM championships;

SELECT 'Teams:' as info;
SELECT t.*, c.name as championship_name FROM teams t 
JOIN championships c ON t.championship_id = c.id;

SELECT 'Matches:' as info;
SELECT m.*, c.name as championship_name FROM matches m 
JOIN championships c ON m.championship_id = c.id;

SELECT 'Players:' as info;
SELECT p.*, c.name as championship_name FROM players p 
JOIN championships c ON p.championship_id = c.id;
