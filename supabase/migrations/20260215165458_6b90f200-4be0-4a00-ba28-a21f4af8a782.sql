
-- ==========================================
-- Career-First Foundation: Phase 1 Schema
-- ==========================================

-- 1. Career Domains
CREATE TABLE public.career_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.career_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read career_domains" ON public.career_domains FOR SELECT USING (true);

-- 2. Career Paths
CREATE TABLE public.career_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES public.career_domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_education_notes TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read career_paths" ON public.career_paths FOR SELECT USING (true);

-- 3. Career Pillars (4 per career path)
CREATE TABLE public.career_pillars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  career_path_id UUID NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 0.25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.career_pillars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read career_pillars" ON public.career_pillars FOR SELECT USING (true);

-- 4. Add career_path_id and primary_pillar_focus to plans
ALTER TABLE public.plans
  ADD COLUMN career_path_id UUID REFERENCES public.career_paths(id),
  ADD COLUMN primary_pillar_focus TEXT[] DEFAULT '{}';

-- 5. Add career_path_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN career_path_id UUID REFERENCES public.career_paths(id);
