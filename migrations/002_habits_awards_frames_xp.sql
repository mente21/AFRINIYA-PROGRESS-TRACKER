-- Run in Supabase SQL editor on existing databases

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_frame_id TEXT DEFAULT 'none';

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'FOCUS',
  icon TEXT,
  streak INT DEFAULT 0,
  xp_per_day INT DEFAULT 50,
  level_progress INT DEFAULT 0,
  activity_grid JSONB DEFAULT '[]',
  reminder TEXT,
  frequency INT DEFAULT 3,
  period TEXT DEFAULT 'week',
  completions_this_period INT DEFAULT 0,
  period_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_target INT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  achieved BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS period_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  xp INT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, period, period_start)
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view habits" ON habits FOR SELECT
USING (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users insert own habits" ON habits FOR INSERT
WITH CHECK (user_id = auth.uid() AND team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users update own habits" ON habits FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own habits" ON habits FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Team can view awards" ON awards FOR SELECT
USING (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users insert own awards" ON awards FOR INSERT
WITH CHECK (user_id = auth.uid() AND team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users update own awards" ON awards FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own awards" ON awards FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Team can view xp events" ON xp_events FOR SELECT
USING (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users insert own xp events" ON xp_events FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team can view period winners" ON period_winners FOR SELECT
USING (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Team can insert period winners" ON period_winners FOR INSERT
WITH CHECK (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));
