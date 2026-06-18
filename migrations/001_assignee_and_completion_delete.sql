-- Run in Supabase SQL editor on existing databases

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE POLICY "Users can delete own completions"
ON task_completions FOR DELETE
USING (user_id = auth.uid());
