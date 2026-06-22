-- Enable Row Level Security on core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY; 
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Profiles policies - team members can see each other
CREATE POLICY "Team members can view profiles" ON profiles
FOR SELECT USING (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert own profile" ON profiles  
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Teams policies  
CREATE POLICY "Team members can view team" ON teams
FOR SELECT USING (
  id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);

-- Tasks policies
CREATE POLICY "Team members can view tasks" ON tasks
FOR SELECT USING (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())  
);

CREATE POLICY "Team members can insert tasks" ON tasks
FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Team members can update tasks" ON tasks  
FOR UPDATE USING (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);

-- Habits policies
CREATE POLICY "Team members can view habits" ON habits
FOR SELECT USING (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Team members can insert habits" ON habits
FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Team members can update habits" ON habits
FOR UPDATE USING (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Team members can delete habits" ON habits  
FOR DELETE USING (
  team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);