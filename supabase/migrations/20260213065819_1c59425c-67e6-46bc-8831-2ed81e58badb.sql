
-- Plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  profile_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert plans" ON public.plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Anyone can update plans" ON public.plans FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete plans" ON public.plans FOR DELETE USING (true);

-- Plan weeks table
CREATE TABLE public.plan_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  focus TEXT NOT NULL,
  milestone TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert plan_weeks" ON public.plan_weeks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read plan_weeks" ON public.plan_weeks FOR SELECT USING (true);
CREATE POLICY "Anyone can update plan_weeks" ON public.plan_weeks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete plan_weeks" ON public.plan_weeks FOR DELETE USING (true);

CREATE INDEX idx_plan_weeks_plan_id ON public.plan_weeks(plan_id);
