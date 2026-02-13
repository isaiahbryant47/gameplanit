
-- Weekly check-in snapshots for predictive analytics
CREATE TABLE public.weekly_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_hash TEXT NOT NULL, -- anonymized user identifier (SHA hash of local userId)
  plan_hash TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  completed_actions_count INTEGER NOT NULL DEFAULT 0,
  total_actions_count INTEGER NOT NULL DEFAULT 0,
  grade_level TEXT,
  time_per_week_hours NUMERIC,
  transportation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prediction snapshots for partner analytics
CREATE TABLE public.prediction_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_hash TEXT NOT NULL,
  plan_hash TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  adherence_probability NUMERIC NOT NULL,
  risk_flag BOOLEAN NOT NULL DEFAULT false,
  top_drivers JSONB NOT NULL DEFAULT '[]'::jsonb,
  grade_level TEXT,
  time_per_week_hours NUMERIC,
  transportation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read for partner analytics (anonymized data only)
CREATE POLICY "Anyone can read checkins" ON public.weekly_checkins FOR SELECT USING (true);
CREATE POLICY "Anyone can insert checkins" ON public.weekly_checkins FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read predictions" ON public.prediction_snapshots FOR SELECT USING (true);
CREATE POLICY "Anyone can insert predictions" ON public.prediction_snapshots FOR INSERT WITH CHECK (true);

-- Indexes for analytics queries
CREATE INDEX idx_checkins_grade ON public.weekly_checkins(grade_level);
CREATE INDEX idx_checkins_transport ON public.weekly_checkins(transportation);
CREATE INDEX idx_predictions_grade ON public.prediction_snapshots(grade_level);
CREATE INDEX idx_predictions_risk ON public.prediction_snapshots(risk_flag);
