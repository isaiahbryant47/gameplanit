
-- Add relationship columns to career_paths
ALTER TABLE public.career_paths
  ADD COLUMN IF NOT EXISTS related_career_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS next_level_career_ids uuid[] NOT NULL DEFAULT '{}';
