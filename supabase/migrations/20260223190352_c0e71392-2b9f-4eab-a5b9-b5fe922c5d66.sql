
-- Create event type enum
CREATE TYPE public.student_event_type AS ENUM (
  'action_completed',
  'action_uncompleted',
  'goal_completed',
  'resource_engaged',
  'opportunity_accepted',
  'cycle_started',
  'reflection_submitted',
  'profile_updated',
  'plan_adapted'
);

-- Create append-only student events table
CREATE TABLE public.student_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type public.student_event_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient queries by user and time
CREATE INDEX idx_student_events_user_id ON public.student_events (user_id, created_at DESC);
CREATE INDEX idx_student_events_type ON public.student_events (event_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.student_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON public.student_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own events
CREATE POLICY "Users can read own events"
  ON public.student_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Partner admins can read all events
CREATE POLICY "Partners can read all events"
  ON public.student_events
  FOR SELECT
  USING (has_role(auth.uid(), 'partner_admin'::app_role));

-- No UPDATE or DELETE — append-only

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_events;
