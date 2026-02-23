
-- Table to replace localStorage-based progress tracking
CREATE TABLE public.user_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  completed_actions jsonb NOT NULL DEFAULT '{}'::jsonb,
  resources_engaged text[] NOT NULL DEFAULT '{}'::text[],
  academic_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_goals jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Users can read own progress
CREATE POLICY "Users can read own progress"
ON public.user_progress FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own progress
CREATE POLICY "Users can insert own progress"
ON public.user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own progress
CREATE POLICY "Users can update own progress"
ON public.user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Partner admins can read all progress
CREATE POLICY "Partners can read all progress"
ON public.user_progress FOR SELECT
USING (has_role(auth.uid(), 'partner_admin'::app_role));

-- Auto-update timestamp
CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
