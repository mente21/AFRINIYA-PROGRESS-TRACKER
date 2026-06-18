-- Supabase DB Schema Setup for Afrinias Team Productivity Platform

DROP TABLE IF EXISTS period_winners CASCADE;
DROP TABLE IF EXISTS xp_events CASCADE;
DROP TABLE IF EXISTS award_claims CASCADE;
DROP TABLE IF EXISTS awards CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS task_completions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT,
  avatar TEXT,
  title TEXT DEFAULT 'Novice',
  level INT DEFAULT 1,
  total_xp INT DEFAULT 0,
  equipped_frame_id TEXT DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  task_type TEXT,
  deadline TEXT,
  xp_reward INT DEFAULT 150,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Task Completions Table
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id) -- Ensures a user can only complete a task once
);

-- 5. Habits (team-visible, per-user management)
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

-- 6. Awards (team-visible, per-user management)
CREATE TABLE IF NOT EXISTS awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  achieved BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.5. Award Claims (independent progress claiming)
CREATE TABLE IF NOT EXISTS award_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id UUID REFERENCES awards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(award_id, user_id)
);

-- 7. XP Events (for period winner tracking)
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Period Winners
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

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_winners ENABLE ROW LEVEL SECURITY;

-- Default Team Insert (To avoid complex onboarding for now, we'll auto-assign users to this team)
INSERT INTO teams (id, name) 
VALUES ('16890efb-a4c1-4886-8f5f-2c04915b24ce', 'Default Company Team')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies

-- Teams: Anyone can read teams
CREATE POLICY "Anyone can read teams" ON teams FOR SELECT USING (true);

-- Profiles: Users can read all profiles (simplifies cross-team visibility and prevents infinite recursion)
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (id = auth.uid());

-- Tasks: Users can read, insert, update tasks for their team
CREATE POLICY "Users can manage tasks in their team" 
ON tasks FOR ALL 
USING (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);

-- Task Completions: Users can view completions for tasks in their team, but only insert their own
CREATE POLICY "Users can view completions for their team" 
ON task_completions FOR SELECT 
USING (
  task_id IN (SELECT id FROM tasks WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
);

CREATE POLICY "Users can insert own completions" 
ON task_completions FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own completions"
ON task_completions FOR DELETE
USING (user_id = auth.uid());

-- Habits: team read, owner write
CREATE POLICY "Team can view habits" ON habits FOR SELECT
USING (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users insert own habits" ON habits FOR INSERT
WITH CHECK (user_id = auth.uid() AND team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users update own habits" ON habits FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users delete own habits" ON habits FOR DELETE
USING (user_id = auth.uid());

-- Awards: team read, owner write
CREATE POLICY "Team can view awards" ON awards FOR SELECT
USING (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users insert own awards" ON awards FOR INSERT
WITH CHECK (user_id = auth.uid() AND team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users update own awards" ON awards FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users delete own awards" ON awards FOR DELETE
USING (user_id = auth.uid());

-- XP Events: team read, own insert
CREATE POLICY "Team can view xp events" ON xp_events FOR SELECT
USING (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users insert own xp events" ON xp_events FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Period Winners: team read/write
CREATE POLICY "Team can view period winners" ON period_winners FOR SELECT
USING (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Team can insert period winners" ON period_winners FOR INSERT
WITH CHECK (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));

-- Award Claims: team read, own insert/delete
CREATE POLICY "Team can view award claims" ON award_claims FOR SELECT
USING (true);

CREATE POLICY "Users can insert own award claims" ON award_claims FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own award claims" ON award_claims FOR DELETE
USING (user_id = auth.uid());
