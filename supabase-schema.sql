-- =====================================================
-- Jedi Spelling Academy - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- =====================================================
-- GAME PROGRESS
-- =====================================================
CREATE TABLE IF NOT EXISTS game_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  total_score INTEGER DEFAULT 0 CHECK (total_score >= 0),
  jedi_rank TEXT DEFAULT 'Youngling',
  lightsaber_color INTEGER DEFAULT 0,
  kyber_crystals INTEGER DEFAULT 0,
  planets_completed JSONB DEFAULT '[]'::jsonb,
  word_progress JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_progress_user ON game_progress(user_id);

-- =====================================================
-- SPELLING SESSIONS (Analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS spelling_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  attempts INTEGER DEFAULT 1,
  time_taken_ms INTEGER,
  level INTEGER,
  is_boss_battle BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spelling_sessions_user ON spelling_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_spelling_sessions_word ON spelling_sessions(word);
CREATE INDEX IF NOT EXISTS idx_spelling_sessions_created ON spelling_sessions(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_seen_at = NOW() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_progress_update ON game_progress;
CREATE TRIGGER on_progress_update
  AFTER INSERT OR UPDATE ON game_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE spelling_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on users') THEN
    CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on game_progress') THEN
    CREATE POLICY "Allow all on game_progress" ON game_progress FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on spelling_sessions') THEN
    CREATE POLICY "Allow all on spelling_sessions" ON spelling_sessions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- VIEWS
-- =====================================================

CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.id AS user_id,
  u.username,
  gp.level,
  gp.total_score,
  gp.jedi_rank,
  gp.kyber_crystals,
  COUNT(ss.id) AS total_attempts,
  COUNT(ss.id) FILTER (WHERE ss.correct) AS correct_attempts,
  ROUND(
    COUNT(ss.id) FILTER (WHERE ss.correct)::NUMERIC /
    NULLIF(COUNT(ss.id), 0) * 100, 1
  ) AS accuracy_percent,
  COUNT(DISTINCT ss.word) AS unique_words_practiced,
  MAX(ss.created_at) AS last_practice
FROM users u
LEFT JOIN game_progress gp ON u.id = gp.user_id
LEFT JOIN spelling_sessions ss ON u.id = ss.user_id
GROUP BY u.id, u.username, gp.level, gp.total_score, gp.jedi_rank, gp.kyber_crystals;

CREATE OR REPLACE VIEW struggling_words AS
SELECT
  user_id,
  word,
  COUNT(*) AS attempts,
  COUNT(*) FILTER (WHERE correct) AS correct,
  ROUND(
    COUNT(*) FILTER (WHERE correct)::NUMERIC / COUNT(*) * 100, 1
  ) AS accuracy_percent
FROM spelling_sessions
GROUP BY user_id, word
HAVING COUNT(*) >= 3 AND COUNT(*) FILTER (WHERE correct)::NUMERIC / COUNT(*) < 0.7
ORDER BY accuracy_percent ASC;
