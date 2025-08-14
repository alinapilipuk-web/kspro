-- Create championships table
CREATE TABLE IF NOT EXISTS championships (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  season VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  tournament_type VARCHAR(20) DEFAULT 'league' CHECK (tournament_type IN ('league', 'cup')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  logo TEXT,
  championship_id INTEGER REFERENCES championships(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  round INTEGER NOT NULL,
  date DATE NOT NULL,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  home_score INTEGER DEFAULT NULL,
  away_score INTEGER DEFAULT NULL,
  is_finished BOOLEAN DEFAULT FALSE,
  championship_id INTEGER REFERENCES championships(id) ON DELETE CASCADE,
  match_time TIME,
  cup_stage VARCHAR(50),
  is_technical_defeat BOOLEAN DEFAULT false,
  technical_winner VARCHAR(255),
  penalty_home INTEGER,
  penalty_away INTEGER,
  penalty_winner VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  team VARCHAR(255) NOT NULL,
  goals INTEGER DEFAULT 0,
  championship_id INTEGER REFERENCES championships(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_goals table
CREATE TABLE IF NOT EXISTS match_goals (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  minute INTEGER,
  goal_type VARCHAR(20) DEFAULT 'regular' CHECK (goal_type IN ('regular', 'penalty', 'own_goal')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on championships" ON championships FOR SELECT USING (true);
CREATE POLICY "Allow public read access on teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access on matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read access on match_goals" ON match_goals FOR SELECT USING (true);

-- Create policies for authenticated users (admin) to modify data
CREATE POLICY "Allow authenticated users to insert championships" ON championships FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update championships" ON championships FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete championships" ON championships FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert teams" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update teams" ON teams FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete teams" ON teams FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert matches" ON matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update matches" ON matches FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete matches" ON matches FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert players" ON players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update players" ON players FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete players" ON players FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert match_goals" ON match_goals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update match_goals" ON match_goals FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete match_goals" ON match_goals FOR DELETE USING (auth.role() = 'authenticated');
