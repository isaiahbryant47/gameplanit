
-- Tighten resources write access to partner_admins only
DROP POLICY IF EXISTS "Anyone can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Anyone can update resources" ON public.resources;
DROP POLICY IF EXISTS "Anyone can delete resources" ON public.resources;

CREATE POLICY "Partners can insert resources"
  ON public.resources FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Partners can update resources"
  ON public.resources FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Partners can delete resources"
  ON public.resources FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'partner_admin'));

-- Tighten prediction_snapshots and weekly_checkins INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can insert predictions" ON public.prediction_snapshots;
DROP POLICY IF EXISTS "Anyone can insert checkins" ON public.weekly_checkins;

CREATE POLICY "Authenticated can insert predictions"
  ON public.prediction_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert checkins"
  ON public.weekly_checkins FOR INSERT
  TO authenticated
  WITH CHECK (true);
