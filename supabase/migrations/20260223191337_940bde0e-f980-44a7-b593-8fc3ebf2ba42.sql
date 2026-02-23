
-- Pre-computed partner analytics snapshot (single row, rebuilt periodically)
CREATE TABLE public.partner_analytics_snapshot (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_analytics_snapshot ENABLE ROW LEVEL SECURITY;

-- Only partner_admins can read snapshots
CREATE POLICY "Partner admins can read analytics snapshots"
  ON public.partner_analytics_snapshot FOR SELECT
  USING (public.has_role(auth.uid(), 'partner_admin'));

-- Service role inserts/updates via edge function (no user INSERT policy needed)
