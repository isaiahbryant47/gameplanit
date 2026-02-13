
-- Drop restrictive insert/update/delete policies since app uses localStorage auth (not Supabase auth)
-- Replace with open policies for now; will tighten when migrating to Supabase auth

DROP POLICY "Authenticated users can insert resources" ON public.resources;
DROP POLICY "Creators can update own resources" ON public.resources;
DROP POLICY "Creators can delete own resources" ON public.resources;

-- Allow anyone to insert resources (public access since no Supabase auth yet)
CREATE POLICY "Anyone can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update resources"
  ON public.resources FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete resources"
  ON public.resources FOR DELETE
  USING (true);

-- Also allow reading all resources (not just active ones) for admin view
DROP POLICY "Anyone can read active resources" ON public.resources;
CREATE POLICY "Anyone can read resources"
  ON public.resources FOR SELECT
  USING (true);
