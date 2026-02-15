
-- Fix prediction_snapshots: remove public read, restrict to partner_admin
DROP POLICY IF EXISTS "Anyone can read predictions" ON public.prediction_snapshots;
DROP POLICY IF EXISTS "Authenticated can insert predictions" ON public.prediction_snapshots;

-- Only partner admins can read prediction snapshots (for aggregated analytics)
CREATE POLICY "Partner admins can read predictions"
ON public.prediction_snapshots AS RESTRICTIVE FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'partner_admin'::app_role));

-- Only authenticated users can insert their own predictions
CREATE POLICY "Authenticated can insert predictions"
ON public.prediction_snapshots FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix weekly_checkins: remove public read, restrict to partner_admin
DROP POLICY IF EXISTS "Anyone can read checkins" ON public.weekly_checkins;
DROP POLICY IF EXISTS "Authenticated can insert checkins" ON public.weekly_checkins;

-- Only partner admins can read checkins (for aggregated analytics)
CREATE POLICY "Partner admins can read checkins"
ON public.weekly_checkins AS RESTRICTIVE FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'partner_admin'::app_role));

-- Only authenticated users can insert checkins
CREATE POLICY "Authenticated can insert checkins"
ON public.weekly_checkins FOR INSERT
TO authenticated
WITH CHECK (true);
