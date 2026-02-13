
-- Resource categories enum
CREATE TYPE public.resource_category AS ENUM ('online_learning', 'local_opportunity', 'scholarship', 'mentorship', 'community_event', 'career_program');

-- Transportation compatibility enum (reuse concept)
CREATE TYPE public.transport_mode AS ENUM ('walk', 'public', 'car', 'mixed', 'virtual');

-- Resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  category resource_category NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  grade_levels TEXT[] NOT NULL DEFAULT '{}',
  zip_prefixes TEXT[] NOT NULL DEFAULT '{}',
  cost_dollars NUMERIC NOT NULL DEFAULT 0,
  transportation transport_mode NOT NULL DEFAULT 'virtual',
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Everyone can read active resources
CREATE POLICY "Anyone can read active resources"
  ON public.resources FOR SELECT
  USING (is_active = true);

-- Authenticated users can insert (admin check will be app-level for now)
CREATE POLICY "Authenticated users can insert resources"
  ON public.resources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Creators can update their own resources
CREATE POLICY "Creators can update own resources"
  ON public.resources FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Creators can delete their own resources
CREATE POLICY "Creators can delete own resources"
  ON public.resources FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX idx_resources_grade_levels ON public.resources USING GIN(grade_levels);
CREATE INDEX idx_resources_zip_prefixes ON public.resources USING GIN(zip_prefixes);
