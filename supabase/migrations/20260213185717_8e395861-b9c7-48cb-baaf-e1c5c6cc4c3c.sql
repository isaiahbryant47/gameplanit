
-- GoalDomain enum
CREATE TYPE public.goal_domain AS ENUM ('college', 'career', 'health_fitness');

-- Pathways table
CREATE TABLE public.pathways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain public.goal_domain NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  default_milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pathways" ON public.pathways FOR SELECT USING (true);

-- User pathways
CREATE TABLE public.user_pathways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pathway_id UUID NOT NULL REFERENCES public.pathways(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read user_pathways" ON public.user_pathways FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user_pathways" ON public.user_pathways FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_pathways" ON public.user_pathways FOR UPDATE USING (true);

-- Extend plans with pathway fields
ALTER TABLE public.plans
  ADD COLUMN pathway_id UUID REFERENCES public.pathways(id),
  ADD COLUMN cycle_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN outcome_statement TEXT,
  ADD COLUMN target_date TEXT,
  ADD COLUMN goal_domain TEXT;

-- Opportunities
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain public.goal_domain NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_step_cta_label TEXT NOT NULL DEFAULT 'Learn More',
  next_step_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read opportunities" ON public.opportunities FOR SELECT USING (true);

-- Pathway-Opportunity mapping
CREATE TABLE public.pathway_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pathway_id UUID NOT NULL REFERENCES public.pathways(id),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id),
  unlock_rule_json JSONB NOT NULL DEFAULT '{"type": "cycle_complete", "cycle": 1}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pathway_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pathway_opportunities" ON public.pathway_opportunities FOR SELECT USING (true);

-- User unlocked opportunities tracking
CREATE TABLE public.user_unlocked_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

ALTER TABLE public.user_unlocked_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read user_unlocked_opportunities" ON public.user_unlocked_opportunities FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user_unlocked_opportunities" ON public.user_unlocked_opportunities FOR INSERT WITH CHECK (true);
