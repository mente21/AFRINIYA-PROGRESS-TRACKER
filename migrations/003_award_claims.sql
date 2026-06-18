-- Run in Supabase SQL editor to enable shared awards and independent claiming
CREATE TABLE IF NOT EXISTS award_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id UUID REFERENCES awards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(award_id, user_id)
);

-- Enable RLS
ALTER TABLE award_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team can view award claims" ON award_claims FOR SELECT
USING (true);

CREATE POLICY "Users can insert own award claims" ON award_claims FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own award claims" ON award_claims FOR DELETE
USING (user_id = auth.uid());
