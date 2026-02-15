
-- Phase 3: Career Readiness Scoring Engine

-- 1. User Pillar Progress - tracks per-pillar scores
CREATE TABLE public.user_pillar_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  career_pillar_id UUID NOT NULL REFERENCES public.career_pillars(id) ON DELETE CASCADE,
  progress_score NUMERIC NOT NULL DEFAULT 0 CHECK (progress_score >= 0 AND progress_score <= 100),
  milestone_contribution NUMERIC NOT NULL DEFAULT 0,
  cycle_contribution NUMERIC NOT NULL DEFAULT 0,
  opportunity_contribution NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, career_pillar_id)
);

-- 2. User Readiness - tracks overall career readiness
CREATE TABLE public.user_readiness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  career_path_id UUID NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  previous_score NUMERIC NOT NULL DEFAULT 0,
  strongest_pillar TEXT,
  weakest_pillar TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, career_path_id)
);

-- Enable RLS
ALTER TABLE public.user_pillar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_readiness ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_pillar_progress
CREATE POLICY "Users can read own pillar progress"
  ON public.user_pillar_progress FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'partner_admin'::app_role));

CREATE POLICY "Users can insert own pillar progress"
  ON public.user_pillar_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pillar progress"
  ON public.user_pillar_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for user_readiness
CREATE POLICY "Users can read own readiness"
  ON public.user_readiness FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'partner_admin'::app_role));

CREATE POLICY "Users can insert own readiness"
  ON public.user_readiness FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own readiness"
  ON public.user_readiness FOR UPDATE
  USING (auth.uid() = user_id);
