-- Migration 005: Create feeds and badges tables

-- Drop tables if they exist
DROP TABLE IF EXISTS feeds CASCADE;
DROP TABLE IF EXISTS badges CASCADE;

-- 1. Create Badges Table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_key TEXT NOT NULL, -- e.g., 'badge_starter', 'badge_grinder', etc.
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_required INT NOT NULL,
  color TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_key) -- Each user can have each badge only once
);

-- 2. Create Feeds Table
CREATE TABLE IF NOT EXISTS feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feed_key TEXT NOT NULL, -- Original frontend ID for tracking
  type TEXT NOT NULL, -- 'achievement', 'challenge', 'surpassed'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  time_ago TEXT NOT NULL,
  avatar TEXT,
  retaliated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Badges
CREATE POLICY "Users can view their own badges" 
ON badges FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own badges" 
ON badges FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own badges" 
ON badges FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own badges" 
ON badges FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for Feeds
CREATE POLICY "Users can view their own feeds" 
ON feeds FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own feeds" 
ON feeds FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own feeds" 
ON feeds FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own feeds" 
ON feeds FOR DELETE 
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_badges_user_id ON badges(user_id);
CREATE INDEX idx_badges_unlocked_at ON badges(unlocked_at);
CREATE INDEX idx_feeds_user_id ON feeds(user_id);
CREATE INDEX idx_feeds_created_at ON feeds(created_at DESC);
