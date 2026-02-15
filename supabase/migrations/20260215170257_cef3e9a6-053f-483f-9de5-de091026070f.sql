
-- ==========================================
-- Phase 2: Opportunity Unlock Engine Schema
-- ==========================================

-- Opportunity type enum
CREATE TYPE public.opportunity_type AS ENUM (
  'internship', 'scholarship', 'program', 'certification', 'event', 'competition'
);

-- 1. Career Opportunities
CREATE TABLE public.career_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  career_path_id UUID NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type public.opportunity_type NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 3),
  external_url TEXT,
  next_action_label TEXT NOT NULL DEFAULT 'Get Started',
  next_action_instructions TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.career_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read career_opportunities" ON public.career_opportunities FOR SELECT USING (true);

-- 2. Unlock Rules (1+ per opportunity)
CREATE TABLE public.career_unlock_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.career_opportunities(id) ON DELETE CASCADE,
  required_cycle_number INTEGER,
  required_pillar TEXT,
  required_milestone_completion_rate INTEGER NOT NULL DEFAULT 0,
  required_manual_flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.career_unlock_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read career_unlock_rules" ON public.career_unlock_rules FOR SELECT USING (true);

-- 3. User unlocked opportunities
CREATE TABLE public.user_career_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES public.career_opportunities(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen BOOLEAN NOT NULL DEFAULT false,
  accepted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, opportunity_id)
);
ALTER TABLE public.user_career_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own career unlocks"
  ON public.user_career_unlocks FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Users can insert own career unlocks"
  ON public.user_career_unlocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career unlocks"
  ON public.user_career_unlocks FOR UPDATE
  USING (auth.uid() = user_id);
