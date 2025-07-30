-- NFL Picks Database Schema
-- This file initializes the PostgreSQL database with the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL CHECK (length(name) >= 3),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    max_members INTEGER CHECK (max_members >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group codes table
CREATE TABLE IF NOT EXISTS group_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL CHECK (length(code) >= 6),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL CHECK (length(username) >= 3),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 18),
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    home_score INTEGER CHECK (home_score >= 0),
    away_score INTEGER CHECK (away_score >= 0),
    game_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    external_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Picks table
CREATE TABLE IF NOT EXISTS picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 18),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    selected_team VARCHAR(100) NOT NULL,
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can only have one pick per game
    UNIQUE(user_id, game_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active);

CREATE INDEX IF NOT EXISTS idx_group_codes_code ON group_codes(code);
CREATE INDEX IF NOT EXISTS idx_group_codes_group ON group_codes(group_id);
CREATE INDEX IF NOT EXISTS idx_group_codes_active ON group_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);

CREATE INDEX IF NOT EXISTS idx_games_week ON games(week_number);
CREATE INDEX IF NOT EXISTS idx_games_time ON games(game_time);
CREATE INDEX IF NOT EXISTS idx_games_completed ON games(is_completed);
CREATE INDEX IF NOT EXISTS idx_games_external_id ON games(external_id);

CREATE INDEX IF NOT EXISTS idx_picks_user_week ON picks(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_picks_week ON picks(week_number);
CREATE INDEX IF NOT EXISTS idx_picks_game ON picks(game_id);
CREATE INDEX IF NOT EXISTS idx_picks_correct ON picks(is_correct);

-- Create a view for leaderboard queries
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(CASE WHEN p.is_correct = true THEN 1 END) as total_correct,
    COUNT(CASE WHEN p.is_correct IS NOT NULL THEN 1 END) as total_picks,
    CASE 
        WHEN COUNT(CASE WHEN p.is_correct IS NOT NULL THEN 1 END) > 0 
        THEN ROUND((COUNT(CASE WHEN p.is_correct = true THEN 1 END)::decimal / COUNT(CASE WHEN p.is_correct IS NOT NULL THEN 1 END)) * 100, 1)
        ELSE 0 
    END as accuracy_percentage
FROM users u
LEFT JOIN picks p ON u.id = p.user_id
GROUP BY u.id, u.username;

-- Create a view for weekly leaderboard queries
CREATE OR REPLACE VIEW weekly_leaderboard_view AS
SELECT 
    u.id as user_id,
    u.username,
    p.week_number,
    COUNT(CASE WHEN p.is_correct = true THEN 1 END) as weekly_correct,
    COUNT(CASE WHEN p.is_correct IS NOT NULL THEN 1 END) as weekly_picks,
    CASE 
        WHEN COUNT(CASE WHEN p.is_correct IS NOT NULL THEN 1 END) > 0 
        THEN ROUND((COUNT(CASE WHEN p.is_correct = true THEN 1 END)::decimal / COUNT(CASE WHEN p.is_correct IS NOT NULL THEN 1 END)) * 100, 1)
        ELSE 0 
    END as weekly_accuracy_percentage
FROM users u
LEFT JOIN picks p ON u.id = p.user_id
GROUP BY u.id, u.username, p.week_number;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_picks_updated_at BEFORE UPDATE ON picks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional - remove in production)
-- This creates a test group, code, user and some sample games for week 1
DO $$
DECLARE
    default_group_id UUID;
BEGIN
    -- Only insert sample data if tables are empty
    IF NOT EXISTS (SELECT 1 FROM groups LIMIT 1) THEN
        -- Insert default group
        INSERT INTO groups (name, description, max_members) VALUES 
        ('Default Group', 'Default group for testing', 50)
        RETURNING id INTO default_group_id;
        
        -- Insert group code
        INSERT INTO group_codes (code, group_id) VALUES 
        ('TEST2025', default_group_id);
        
        -- Insert sample user
        INSERT INTO users (username, email, password_hash, group_id) VALUES 
        -- Password is 'password123' hashed with bcrypt
        ('testuser', 'test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/A3nN1T7LG', default_group_id);
        
        -- Insert sample games for week 1 (using realistic 2025 season start date)
        INSERT INTO games (week_number, home_team, away_team, game_time, external_id) VALUES
        (1, 'Kansas City Chiefs', 'Baltimore Ravens', '2025-09-08 20:00:00-05', '2025-W1-1'),
        (1, 'Buffalo Bills', 'Miami Dolphins', '2025-09-14 13:00:00-05', '2025-W1-2'),
        (1, 'Cincinnati Bengals', 'Pittsburgh Steelers', '2025-09-14 13:00:00-05', '2025-W1-3'),
        (1, 'Green Bay Packers', 'Chicago Bears', '2025-09-14 13:00:00-05', '2025-W1-4'),
        (1, 'New England Patriots', 'Philadelphia Eagles', '2025-09-14 13:00:00-05', '2025-W1-5'),
        (1, 'Tennessee Titans', 'New Orleans Saints', '2025-09-14 13:00:00-05', '2025-W1-6'),
        (1, 'Cleveland Browns', 'Dallas Cowboys', '2025-09-14 13:00:00-05', '2025-W1-7'),
        (1, 'Jacksonville Jaguars', 'Indianapolis Colts', '2025-09-14 13:00:00-05', '2025-W1-8'),
        (1, 'Arizona Cardinals', 'San Francisco 49ers', '2025-09-14 16:05:00-05', '2025-W1-9'),
        (1, 'Seattle Seahawks', 'Los Angeles Rams', '2025-09-14 16:05:00-05', '2025-W1-10'),
        (1, 'Las Vegas Raiders', 'Los Angeles Chargers', '2025-09-14 16:05:00-05', '2025-W1-11'),
        (1, 'Tampa Bay Buccaneers', 'Washington Commanders', '2025-09-14 16:25:00-05', '2025-W1-12'),
        (1, 'New York Giants', 'Minnesota Vikings', '2025-09-14 16:25:00-05', '2025-W1-13'),
        (1, 'Carolina Panthers', 'Atlanta Falcons', '2025-09-14 16:25:00-05', '2025-W1-14'),
        (1, 'Houston Texans', 'Denver Broncos', '2025-09-14 20:20:00-05', '2025-W1-15'),
        (1, 'Detroit Lions', 'New York Jets', '2025-09-15 20:15:00-05', '2025-W1-16');
        
        RAISE NOTICE 'Sample data inserted successfully';
    END IF;
END $$;